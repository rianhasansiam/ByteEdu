"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  student: { name: string; roll: string | null; className: string | null; sectionName: string | null; institutionName: string | null; picture: string | null };
  attendance: { total: number; present: number; absent: number; late: number; percentage: string; todayStatus: string | null };
  recentNotices: { id: string; title: string; priority: string; date: string }[];
  recentMarks: { id: string; subjectName: string; marks: number | null; maxMarks: number; examType: string; date: string }[];
  unreadNotifications: number;
  upcomingExams: { id: string; name: string; subjectName: string; date: string; startTime: string | null }[];
  pendingAssignments: number;
}

export default function StudentDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d?.student) {
          setData(d);
        } else {
          setError(d?.error || "Failed to load dashboard data");
        }
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[40vh] text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-gray-700 font-medium">{error || "Could not load dashboard"}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
          Retry
        </button>
      </div>
    );
  }

  const { student, attendance, recentNotices, recentMarks, upcomingExams, pendingAssignments, unreadNotifications } = data;

  const todayBadge: Record<string, string> = {
    PRESENT: "bg-emerald-100 text-emerald-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-amber-100 text-amber-700",
    EXCUSED: "bg-blue-100 text-blue-700",
  };

  const priorityColor: Record<string, string> = {
    urgent: "bg-red-100 text-red-700",
    high: "bg-orange-100 text-orange-700",
    normal: "bg-gray-100 text-gray-700",
    low: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {student.name?.split(" ")[0] || "Student"}! 👋
        </h1>
        <p className="text-gray-500 mt-1">
          {student.className && student.sectionName
            ? `${student.className} - Section ${student.sectionName}`
            : "No class assigned yet"}{" "}
          {student.institutionName && `• ${student.institutionName}`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {/* Attendance */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Attendance</p>
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{attendance.percentage}%</p>
          <p className="text-xs text-gray-400 mt-1">{attendance.total} total days</p>
        </div>

        {/* Today */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-sm text-gray-500 mb-2">Today</p>
          {attendance.todayStatus ? (
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${todayBadge[attendance.todayStatus] || "bg-gray-100"}`}>
              {attendance.todayStatus}
            </span>
          ) : (
            <p className="text-sm text-gray-400">Not marked</p>
          )}
        </div>

        {/* Pending Assignments */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Pending Work</p>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingAssignments}</p>
          <p className="text-xs text-gray-400 mt-1">assignments due</p>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-500">Notifications</p>
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{unreadNotifications}</p>
          <p className="text-xs text-gray-400 mt-1">unread</p>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Exams</h2>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming exams</p>
          ) : (
            <div className="space-y-3">
              {upcomingExams.map((exam) => (
                <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{exam.name}</p>
                    <p className="text-xs text-gray-500">{exam.subjectName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(exam.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                    {exam.startTime && <p className="text-xs text-gray-400">{exam.startTime}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notices</h2>
          {recentNotices.length === 0 ? (
            <p className="text-sm text-gray-400">No notices</p>
          ) : (
            <div className="space-y-3">
              {recentNotices.map((notice) => (
                <div key={notice.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{notice.title}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notice.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColor[notice.priority] || "bg-gray-100"}`}>
                    {notice.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Results */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h2>
          {recentMarks.length === 0 ? (
            <p className="text-sm text-gray-400">No results yet</p>
          ) : (
            <div className="space-y-3">
              {recentMarks.map((mark) => (
                <div key={mark.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{mark.subjectName}</p>
                    <p className="text-xs text-gray-400">{mark.examType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">
                      {mark.marks !== null ? `${mark.marks}/${mark.maxMarks}` : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
