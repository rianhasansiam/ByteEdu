"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";

interface Notice {
  id: string; title: string; content: string; priority: string;
  targetType: string; targetRole: string | null;
  isPublished: boolean; publishedAt: string | null; createdAt: string;
}

export default function AdminNoticePage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", priority: "normal", isPublished: false });

  const fetchNotices = async () => {
    try {
      const res = await fetch("/api/admin/notices");
      if (res.ok) {
        const data = await res.json();
        setNotices(data.notices || []);
      }
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotices(); }, []);

  const resetForm = () => {
    setForm({ title: "", content: "", priority: "normal", isPublished: false });
    setEditId(null); setShowForm(false);
  };

  const handleEdit = (notice: Notice) => {
    setForm({ title: notice.title, content: notice.content, priority: notice.priority, isPublished: notice.isPublished });
    setEditId(notice.id); setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) { toast.error("Title and content required"); return; }
    setSubmitting(true);
    try {
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...form } : form;
      const res = await fetch("/api/admin/notices", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editId ? "Notice updated!" : "Notice created!");
        resetForm(); await fetchNotices();
      } else { const data = await res.json(); toast.error(data.error || "Failed"); }
    } catch { toast.error("Network error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await sweetConfirm("Delete this notice?"))) return;
    try {
      const res = await fetch(`/api/admin/notices?id=${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Deleted"); setNotices((prev) => prev.filter((n) => n.id !== id)); }
      else { toast.error("Failed"); }
    } catch { toast.error("Network error"); }
  };

  const handleTogglePublish = async (notice: Notice) => {
    try {
      const res = await fetch("/api/admin/notices", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notice.id, isPublished: !notice.isPublished }),
      });
      if (res.ok) {
        toast.success(notice.isPublished ? "Unpublished" : "Published!");
        await fetchNotices();
      }
    } catch { toast.error("Network error"); }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "bg-red-100 text-red-700";
      case "high": return "bg-orange-100 text-orange-700";
      case "normal": return "bg-blue-100 text-blue-700";
      case "low": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notice Board</h1>
          <p className="text-gray-600 mt-1">Create and manage announcements</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
          {showForm ? "Cancel" : "+ New Notice"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{editId ? "Edit Notice" : "Create Notice"}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" placeholder="Notice title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" placeholder="Notice content..." />
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-sm text-gray-700">Publish immediately</span>
                </label>
              </div>
            </div>
            <button onClick={handleSubmit} disabled={submitting}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {submitting ? "Saving..." : editId ? "Update Notice" : "Create Notice"}
            </button>
          </div>
        </div>
      )}

      {/* Notices List */}
      <div className="space-y-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
          </div>
        ) : notices.length > 0 ? (
          notices.map((notice) => (
            <div key={notice.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{notice.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(notice.priority)}`}>{notice.priority}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${notice.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {notice.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{notice.content}</p>
                  <p className="text-xs text-gray-400 mt-2">Created: {new Date(notice.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button onClick={() => handleTogglePublish(notice)}
                    className={`px-3 py-1 rounded text-xs font-medium ${notice.isPublished ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                    {notice.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button onClick={() => handleEdit(notice)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium hover:bg-blue-200">Edit</button>
                  <button onClick={() => handleDelete(notice.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">Delete</button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            <p>No notices yet. Click &quot;+ New Notice&quot; to create one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
