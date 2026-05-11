"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type DashboardData = {
  institution: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  } | null;
  stats: {
    totalTeachers: number;
    totalStudents: number;
    totalAdmins: number;
    totalUsers: number;
    totalClasses: number;
    totalSections: number;
    totalSubjects: number;
    unassignedStudents: number;
    teacherAssignments: number;
  };
  subscription: {
    planName: string;
    status: string;
    endDate: string;
    amount: number;
    billingCycle: string;
  } | null;
  attendanceSummary: {
    present: number;
    absent: number;
    late: number;
    excused: number;
  };
  recentActivity: {
    notices: Array<{
      id: string;
      title: string;
      priority: string;
      date: string;
      type: string;
    }>;
    attendance: Array<{
      id: string;
      studentName: string;
      className: string;
      sectionName: string;
      teacherName: string;
      status: string;
      date: string;
      type: string;
    }>;
  };
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalAttendanceToday =
    data
      ? data.attendanceSummary.present +
        data.attendanceSummary.absent +
        data.attendanceSummary.late +
        data.attendanceSummary.excused
      : 0;
  const attendanceRate =
    totalAttendanceToday > 0 && data
      ? Math.round((data.attendanceSummary.present / totalAttendanceToday) * 100)
      : 0;

  const recentActivityItems = data
    ? [
        ...(data.recentActivity?.notices || []),
        ...(data.recentActivity?.attendance || []),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 8)
    : [];

  const subscriptionDaysLeft = data?.subscription?.endDate
    ? Math.max(0, Math.ceil((new Date(data.subscription.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Banner */}
      <div className="welcome-banner rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 text-white relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || "Admin"}
                width={56}
                height={56}
                className="w-14 h-14 rounded-full border-2 border-white/30"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {(session?.user?.name || "A").charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-2xl font-bold">
                Welcome back, {session?.user?.name || "Admin"}!
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                {data?.institution?.name || "Your Institution"} • Admin Panel
              </p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs text-gray-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Role: Admin</p>
          </div>
        </div>
      </div>

      {/* Subscription Alert */}
      {data?.subscription && (
        <div
          className={`rounded-xl p-4 mb-6 flex items-center justify-between ${
            subscriptionDaysLeft <= 7
              ? "bg-red-50 border border-red-200"
              : subscriptionDaysLeft <= 30
              ? "bg-amber-50 border border-amber-200"
              : "bg-green-50 border border-green-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {data.subscription.planName} Plan • {data.subscription.status}
              </p>
              <p className="text-xs text-gray-500">
                {subscriptionDaysLeft > 0
                  ? `${subscriptionDaysLeft} days remaining (expires ${new Date(data.subscription.endDate).toLocaleDateString()})`
                  : "Subscription expired"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        {[
          {
            title: "Teachers",
            value: data?.stats.totalTeachers || 0,
            color: "bg-green-500",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            ),
            onClick: () => router.push("/admin/users?role=TEACHER"),
          },
          {
            title: "Students",
            value: data?.stats.totalStudents || 0,
            color: "bg-blue-500",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            ),
            onClick: () => router.push("/admin/users?role=STUDENT"),
          },
          {
            title: "Classes",
            value: data?.stats.totalClasses || 0,
            color: "bg-purple-500",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ),
            onClick: () => router.push("/admin/classes"),
          },
          {
            title: "Sections",
            value: data?.stats.totalSections || 0,
            color: "bg-amber-500",
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            ),
            onClick: () => router.push("/admin/classes"),
          },
        ].map((card) => (
          <div
            key={card.title}
            className="dash-stat-card p-3.5 sm:p-5 cursor-pointer"
            onClick={card.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-500">{card.title}</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
              <div className={`${card.color} text-white p-2.5 sm:p-3 rounded-xl`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="dash-stat-card p-3 sm:p-4">
          <p className="text-xs font-medium text-gray-500">Total Users</p>
          <p className="text-lg font-bold text-gray-900">{data?.stats.totalUsers || 0}</p>
        </div>
        <div className="dash-stat-card p-3 sm:p-4">
          <p className="text-xs font-medium text-gray-500">Subjects</p>
          <p className="text-lg font-bold text-gray-900">{data?.stats.totalSubjects || 0}</p>
        </div>
        <div className="dash-stat-card p-3 sm:p-4">
          <p className="text-xs font-medium text-gray-500">Teacher Assignments</p>
          <p className="text-lg font-bold text-gray-900">{data?.stats.teacherAssignments || 0}</p>
        </div>
        <div
          className={`rounded-xl shadow-sm border p-4 ${
            (data?.stats.unassignedStudents || 0) > 0
              ? "bg-amber-50 border-amber-200"
              : "bg-white border-gray-100"
          }`}
        >
          <p className="text-xs font-medium text-gray-500">Unassigned Students</p>
          <p className={`text-lg font-bold ${
            (data?.stats.unassignedStudents || 0) > 0 ? "text-amber-700" : "text-gray-900"
          }`}>
            {data?.stats.unassignedStudents || 0}
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Attendance */}
          <div className="dash-card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Today&apos;s Attendance</h2>
            {totalAttendanceToday > 0 ? (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeDasharray={`${attendanceRate}, 100`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold text-gray-900">{attendanceRate}%</span>
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    {[
                      { label: "Present", count: data!.attendanceSummary.present, color: "bg-green-500" },
                      { label: "Absent", count: data!.attendanceSummary.absent, color: "bg-red-500" },
                      { label: "Late", count: data!.attendanceSummary.late, color: "bg-amber-500" },
                      { label: "Excused", count: data!.attendanceSummary.excused, color: "bg-blue-500" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                        <span className="text-sm text-gray-600">{item.label}: <strong>{item.count}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">No attendance recorded today</p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="dash-card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Activity</h2>
            {recentActivityItems.length > 0 ? (
              <div className="space-y-3">
                {recentActivityItems.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.type === "notice"
                          ? "bg-blue-500"
                          : item.status === "PRESENT"
                          ? "bg-green-500"
                          : item.status === "ABSENT"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.type === "notice"
                          ? `📢 ${item.title}`
                          : `${item.studentName} — ${item.status} (${item.className} ${item.sectionName})`}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {item.type === "attendance" && item.teacherName && ` • by ${item.teacherName}`}
                      </p>
                    </div>
                    {item.type === "notice" && item.priority && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          item.priority === "urgent"
                            ? "bg-red-100 text-red-700"
                            : item.priority === "high"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {item.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Admin Profile */}
          <div className="dash-card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Your Profile</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || ""}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                    {(session?.user?.name || "A").charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{session?.user?.name}</p>
                  <p className="text-sm text-gray-500">{session?.user?.email}</p>
                </div>
              </div>
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">ADMIN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Institution</span>
                  <span className="text-gray-900 font-medium">{data?.institution?.name || "-"}</span>
                </div>
                {data?.institution?.createdAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Since</span>
                    <span className="text-gray-900">
                      {new Date(data.institution.createdAt).toLocaleDateString("en-US", {
                        year: "numeric", month: "short",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="dash-card p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { label: "Add Teacher", href: "/teacherSignup", color: "bg-green-50 text-green-700 hover:bg-green-100", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                { label: "Add Student", href: "/studentSignup", color: "bg-blue-50 text-blue-700 hover:bg-blue-100", icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" },
                { label: "Manage Classes", href: "/admin/classes", color: "bg-purple-50 text-purple-700 hover:bg-purple-100", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
                { label: "View All Users", href: "/admin/users", color: "bg-gray-50 text-gray-700 hover:bg-gray-100", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" },
                { label: "Assign Teachers", href: "/admin/assignTeacher", color: "bg-amber-50 text-amber-700 hover:bg-amber-100", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.href)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${action.color}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                  </svg>
                  <span className="font-medium text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Institution Overview */}
          <div className="dash-card p-4 sm:p-6 bg-gradient-to-br from-gray-50/80 to-white">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Institution Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Admins", value: data?.stats.totalAdmins || 0 },
                { label: "Teachers", value: data?.stats.totalTeachers || 0 },
                { label: "Students", value: data?.stats.totalStudents || 0 },
                { label: "Classes", value: data?.stats.totalClasses || 0 },
                { label: "Sections", value: data?.stats.totalSections || 0 },
                { label: "Subjects", value: data?.stats.totalSubjects || 0 },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
