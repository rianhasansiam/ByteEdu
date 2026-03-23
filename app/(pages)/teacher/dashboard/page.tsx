"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { StatCard, AttendanceSummaryCard, SectionCard } from "../components/DashboardCards";
import toast from "react-hot-toast";

interface DashboardData {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    picture: string | null;
    teacherId: string | null;
    institution: {
      id: string;
      name: string;
    } | null;
    assignedSubjects: Array<{
      id: string;
      name: string;
      section: {
        id: string;
        name: string;
        className: string;
      };
    }>;
    classTeacherOf: Array<{
      id: string;
      name: string;
      className: string;
      studentCount: number;
    }>;
  };
  stats: {
    totalStudents: number;
    attendanceSummary: {
      present: number;
      absent: number;
      late: number;
      excused: number;
    };
    totalAssignedSections: number;
    totalSubjects: number;
    isClassTeacher: boolean;
  };
}

interface Section {
  id: string;
  name: string;
  className: string;
  classId: string;
  studentCount: number;
  isClassTeacher: boolean;
  subjects: Array<{ id: string; name: string }>;
}

export default function TeacherDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [dashboardRes, sectionsRes] = await Promise.all([
          fetch("/api/teacher/dashboard"),
          fetch("/api/teacher/sections"),
        ]);

        if (!dashboardRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const dashboardJson = await dashboardRes.json();
        const sectionsJson = await sectionsRes.json();

        setDashboardData(dashboardJson.data);
        setSections(sectionsJson.data || []);
      } catch (error) {
        console.error("Error fetching dashboard:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Unable to load dashboard data</p>
        </div>
      </div>
    );
  }

  const { profile, stats } = dashboardData;

  // Get unique subjects
  const uniqueSubjects = Array.from(
    new Map(profile.assignedSubjects.map((s) => [s.id, s])).values()
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {profile.name}!
        </h1>
        <p className="text-gray-500 mt-1">
          {profile.institution?.name || "No institution assigned"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          color="emerald"
          description="In your assigned sections"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="Assigned Sections"
          value={stats.totalAssignedSections}
          color="blue"
          description="Classes you teach"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />
        <StatCard
          title="Subjects"
          value={stats.totalSubjects}
          color="purple"
          description="Subjects you teach"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <StatCard
          title="Class Teacher"
          value={stats.isClassTeacher ? "Yes" : "No"}
          color={stats.isClassTeacher ? "amber" : "rose"}
          description={stats.isClassTeacher ? `${profile.classTeacherOf.length} section(s)` : "Not assigned"}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Attendance & Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Attendance Summary */}
          <AttendanceSummaryCard
            present={stats.attendanceSummary.present}
            absent={stats.attendanceSummary.absent}
            late={stats.attendanceSummary.late}
            excused={stats.attendanceSummary.excused}
          />

          {/* My Sections */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">My Sections</h3>
              <button
                onClick={() => router.push("/teacher/attendance")}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Take Attendance
              </button>
            </div>
            {sections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section) => (
                  <SectionCard
                    key={section.id}
                    section={section}
                    onClick={() => router.push(`/teacher/students?sectionId=${section.id}`)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No sections assigned yet</p>
            )}
          </div>
        </div>

        {/* Right Column - Profile & Quick Actions */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profile Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">{profile.email}</span>
              </div>
              {profile.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-sm">{profile.phone}</span>
                </div>
              )}
              {profile.teacherId && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                  <span className="text-sm">ID: {profile.teacherId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">My Subjects</h3>
            {uniqueSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {uniqueSubjects.map((subject) => (
                  <span
                    key={subject.id}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"
                  >
                    {subject.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No subjects assigned yet</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/teacher/attendance")}
                className="w-full flex items-center gap-3 p-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Take Attendance
              </button>
              <button
                onClick={() => router.push("/teacher/students")}
                className="w-full flex items-center gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                View Students
              </button>
              <button
                onClick={() => router.push("/teacher/attendance/history")}
                className="w-full flex items-center gap-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Attendance History
              </button>
            </div>
          </div>

          {/* Class Teacher Sections */}
          {profile.classTeacherOf.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">Class Teacher Of</h3>
              <div className="space-y-2">
                {profile.classTeacherOf.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between p-3 bg-white/60 rounded-lg"
                  >
                    <span className="font-medium text-gray-800">
                      {section.className} - {section.name}
                    </span>
                    <span className="text-sm text-amber-700">{section.studentCount} students</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
