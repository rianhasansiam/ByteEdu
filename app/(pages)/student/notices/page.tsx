"use client";

import { useEffect, useState } from "react";

interface Notice { id: string; title: string; content: string; priority: string; publishedAt: string; }

export default function StudentNotices() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/student/notices")
      .then((r) => r.json())
      .then((d) => setNotices(d.notices || []))
      .finally(() => setLoading(false));
  }, []);

  const priorityStyles: Record<string, { bg: string; border: string; badge: string }> = {
    urgent: { bg: "bg-red-50", border: "border-red-200", badge: "bg-red-100 text-red-700" },
    high: { bg: "bg-orange-50", border: "border-orange-200", badge: "bg-orange-100 text-orange-700" },
    normal: { bg: "bg-white", border: "border-gray-200", badge: "bg-gray-100 text-gray-700" },
    low: { bg: "bg-white", border: "border-gray-200", badge: "bg-slate-100 text-slate-500" },
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notices</h1>
        <p className="text-gray-500 mt-1">Important announcements from your institution</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : notices.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          No notices at the moment
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((notice) => {
            const style = priorityStyles[notice.priority] || priorityStyles.normal;
            const isExpanded = expanded === notice.id;
            return (
              <div key={notice.id} className={`${style.bg} rounded-xl border ${style.border} overflow-hidden transition-all`}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : notice.id)}
                  className="w-full text-left p-5 flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${style.badge}`}>
                        {notice.priority}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(notice.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                  </div>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="border-t pt-4 text-gray-700 text-sm whitespace-pre-wrap">{notice.content}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
