"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

type Stats = {
  totalTeachers: number;
  totalStudents: number;
  totalClasses: number;
  totalSections: number;
};

type ActivityItem = {
  id: string;
  type: string;
  date: string;
  title?: string;
  priority?: string;
  studentName?: string;
  className?: string;
  sectionName?: string;
  teacherName?: string;
  status?: string;
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalSections: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats || { totalTeachers: 0, totalStudents: 0, totalClasses: 0, totalSections: 0 });
          const activities: ActivityItem[] = [
            ...(data.recentActivity?.notices || []),
            ...(data.recentActivity?.attendance || []),
          ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);
          setRecentActivity(activities);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Teachers", value: stats.totalTeachers, color: "bg-green-500",
      icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>),
    },
    {
      title: "Total Students", value: stats.totalStudents, color: "bg-orange-500",
      icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>),
    },
    {
      title: "Total Classes", value: stats.totalClasses, color: "bg-blue-500",
      icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>),
    },
    {
      title: "Total Sections", value: stats.totalSections, color: "bg-purple-500",
      icon: (<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
    },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {session?.user?.name || "Admin"}!</p>
        {session?.user?.institutionName && (
          <p className="text-sm text-gray-500 mt-1">{session.user.institutionName}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.title}</p>
                {loading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                )}
              </div>
              <div className={`${card.color} text-white p-3 rounded-lg`}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/teacherSignup" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="bg-green-100 text-green-600 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <span className="font-medium text-gray-700">Add Teacher</span>
          </a>
          <a href="/studentSignup" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="bg-orange-100 text-orange-600 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>
            <span className="font-medium text-gray-700">Add Student</span>
          </a>
          <a href="/admin/assignTeacher" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <span className="font-medium text-gray-700">Assign Teacher</span>
          </a>
          <a href="/admin/users" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
            <span className="font-medium text-gray-700">View All Users</span>
          </a>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 rounded-lg"></div>)}
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  item.type === "notice" ? "bg-blue-500" :
                  item.status === "PRESENT" ? "bg-green-500" :
                  item.status === "ABSENT" ? "bg-red-500" : "bg-yellow-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.type === "notice"
                      ? `📢 ${item.title}`
                      : `${item.studentName} — ${item.status} (${item.className} ${item.sectionName})`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.date).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                    {item.type === "attendance" && item.teacherName && ` • by ${item.teacherName}`}
                  </p>
                </div>
                {item.type === "notice" && item.priority && (
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.priority === "urgent" ? "bg-red-100 text-red-700" :
                    item.priority === "high" ? "bg-orange-100 text-orange-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>{item.priority}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No recent activity to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
