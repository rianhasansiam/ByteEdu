"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
    institution: { id: string; name: string } | null;
    assignedSubjects: Array<{
      id: string;
      name: string;
      section: { id: string; name: string; className: string };
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
    attendanceSummary: { present: number; absent: number; late: number; excused: number };
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
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, secRes] = await Promise.all([
          fetch("/api/teacher/dashboard"),
          fetch("/api/teacher/sections"),
        ]);
        if (!dashRes.ok) throw new Error("Failed to fetch");
        const dashJson = await dashRes.json();
        const secJson = await secRes.json();
        setDashboardData(dashJson.data);
        setSections(secJson.data || []);
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    if (status === "authenticated") fetchData();
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-28 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>)}
          </div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-8 text-center py-12">
        <p className="text-gray-500">Unable to load dashboard data</p>
      </div>
    );
  }

  const { profile, stats } = dashboardData;
  const uniqueSubjects = Array.from(new Map(profile.assignedSubjects.map((s) => [s.id, s])).values());
  const totalAtt = stats.attendanceSummary.present + stats.attendanceSummary.absent + stats.attendanceSummary.late + stats.attendanceSummary.excused;
  const attRate = totalAtt > 0 ? Math.round((stats.attendanceSummary.present / totalAtt) * 100) : 0;

  return (
    <div className="p-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 rounded-xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {profile.picture ? (
              <Image src={profile.picture} alt={profile.name} width={56} height={56} className="w-14 h-14 rounded-full border-2 border-white/30" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {profile.name}!</h1>
              <p className="text-emerald-200 text-sm mt-0.5">
                {profile.institution?.name || "No institution"} • Teacher Panel
              </p>
            </div>
          </div>
          <div className="hidden md:block text-right">
            <p className="text-xs text-emerald-200">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
            {profile.teacherId && <p className="text-xs text-emerald-300 mt-0.5">ID: {profile.teacherId}</p>}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total Students" value={stats.totalStudents} color="emerald" description="In your sections"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
        <StatCard title="Sections" value={stats.totalAssignedSections} color="blue" description="Assigned to you"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>} />
        <StatCard title="Subjects" value={stats.totalSubjects} color="purple" description="You teach"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>} />
        <StatCard title="Class Teacher" value={stats.isClassTeacher ? "Yes" : "No"} color={stats.isClassTeacher ? "amber" : "rose"} description={stats.isClassTeacher ? `${profile.classTeacherOf.length} section(s)` : "Not assigned"}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Attendance Summary */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Today&apos;s Attendance</h3>
            {totalAtt > 0 ? (
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831 15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray={`${attRate}, 100`} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold">{attRate}%</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3">
                  {[
                    { label: "Present", count: stats.attendanceSummary.present, color: "bg-green-500" },
                    { label: "Absent", count: stats.attendanceSummary.absent, color: "bg-red-500" },
                    { label: "Late", count: stats.attendanceSummary.late, color: "bg-amber-500" },
                    { label: "Excused", count: stats.attendanceSummary.excused, color: "bg-blue-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${item.color}`}></div>
                      <span className="text-sm text-gray-600">{item.label}: <strong>{item.count}</strong></span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No attendance taken today</p>
            )}
          </div>

          {/* My Sections */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">My Sections</h3>
              <button onClick={() => router.push("/teacher/attendance")} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Take Attendance →
              </button>
            </div>
            {sections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sections.map((section) => (
                  <SectionCard key={section.id} section={section} onClick={() => router.push(`/teacher/students?sectionId=${section.id}`)} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No sections assigned yet</p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Profile</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {profile.picture ? (
                  <Image src={profile.picture} alt={profile.name} width={48} height={48} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-bold text-gray-600">
                    {profile.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{profile.name}</p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Role</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">TEACHER</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Institution</span>
                  <span className="text-gray-900 font-medium text-right">{profile.institution?.name || "-"}</span>
                </div>
                {profile.phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Phone</span>
                    <span className="text-gray-900">{profile.phone}</span>
                  </div>
                )}
                {profile.teacherId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Teacher ID</span>
                    <span className="text-gray-900">{profile.teacherId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">My Subjects</h3>
            {uniqueSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {uniqueSubjects.map((s) => (
                  <span key={s.id} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No subjects assigned</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Take Attendance", href: "/teacher/attendance", color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
                { label: "View Students", href: "/teacher/students", color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
                { label: "My Classes", href: "/teacher/classes", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
                { label: "Attendance History", href: "/teacher/attendance/history", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                { label: "Assign Students", href: "/teacher/assignStudents", color: "bg-gray-50 text-gray-700 hover:bg-gray-100" },
              ].map((action) => (
                <button key={action.label} onClick={() => router.push(action.href)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors font-medium text-sm ${action.color}`}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          {/* Class Teacher */}
          {profile.classTeacherOf.length > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-amber-800 mb-3">Class Teacher Of</h3>
              <div className="space-y-2">
                {profile.classTeacherOf.map((section) => (
                  <div key={section.id} className="flex items-center justify-between p-3 bg-white/60 rounded-lg">
                    <span className="font-medium text-gray-800">{section.className} - {section.name}</span>
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
