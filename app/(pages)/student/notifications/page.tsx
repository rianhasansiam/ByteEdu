"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Notification {
  id: string; title: string; message: string; type: string; category: string;
  isRead: boolean; link: string | null; createdAt: string;
}

export default function StudentNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    fetch("/api/student/notifications")
      .then((r) => r.json())
      .then((d) => { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const markRead = async (id?: string) => {
    await fetch("/api/student/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { notificationId: id } : { markAll: true }),
    });
    toast.success(id ? "Marked as read" : "All marked as read");
    fetchData();
  };

  const typeStyles: Record<string, string> = {
    info: "border-l-blue-500 bg-blue-50",
    success: "border-l-emerald-500 bg-emerald-50",
    warning: "border-l-amber-500 bg-amber-50",
    urgent: "border-l-red-500 bg-red-50",
  };

  const categoryIcons: Record<string, string> = {
    attendance: "📋", assignment: "📝", result: "📊", notice: "📢", exam: "📖", general: "ℹ️",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markRead()}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
            Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border-l-4 p-4 transition-all ${n.isRead ? "bg-white border-l-gray-200 opacity-70" : typeStyles[n.type] || "bg-white border-l-gray-300"}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{categoryIcons[n.category] || "ℹ️"}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-medium text-sm ${n.isRead ? "text-gray-600" : "text-gray-900"}`}>{n.title}</h3>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)}
                    className="text-xs text-gray-700 hover:text-black whitespace-nowrap">
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
