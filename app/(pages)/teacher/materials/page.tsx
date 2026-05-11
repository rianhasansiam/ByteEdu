"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";

interface Material {
  id: string; title: string; description: string | null; fileUrl: string | null;
  fileType: string | null; subjectName: string; className: string; sectionName: string; createdAt: string;
}

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [sections, setSections] = useState<{ id: string; sectionName: string; className: string; subjectId: string; subjectName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", fileUrl: "", fileType: "", sectionId: "", subjectId: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [matRes, secRes] = await Promise.all([
      fetch("/api/teacher/materials").then((r) => r.json()),
      fetch("/api/teacher/my-sections").then((r) => r.json()),
    ]);
    setMaterials(matRes.materials || []);
    const secs = (secRes.sections || []).map((s: { id: string; section: { id: string; name: string; class: { name: string } }; subjectId: string; subject: { name: string } }) => ({
      id: s.section.id, sectionName: s.section.name, className: s.section.class.name,
      subjectId: s.subjectId, subjectName: s.subject.name,
    }));
    setSections(secs);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.sectionId || !form.subjectId) { toast.error("Fill required fields"); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/materials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Material uploaded"); setShowForm(false); setForm({ title: "", description: "", fileUrl: "", fileType: "", sectionId: "", subjectId: "" }); fetchData(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await sweetConfirm("Delete this material?"))) return;
    const res = await fetch(`/api/teacher/materials?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchData(); } else toast.error("Failed");
  };

  const availableSubjects = sections.filter((s) => s.id === form.sectionId);
  const typeIcon: Record<string, string> = { pdf: "📄", doc: "📝", image: "🖼️", video: "🎥", link: "🔗" };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
          <p className="text-gray-500 mt-1">Share resources with your students</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          {showForm ? "Cancel" : "+ Upload Material"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Study Material</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Material title" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section*</label>
              <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value, subjectId: "" })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select section</option>
                {[...new Map(sections.map((s) => [s.id, s])).values()].map((s) => (
                  <option key={s.id} value={s.id}>{s.className} - {s.sectionName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject*</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" disabled={!form.sectionId}>
                <option value="">Select subject</option>
                {availableSubjects.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>{s.subjectName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File Type</label>
              <select value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select type</option>
                <option value="pdf">PDF</option>
                <option value="doc">Document</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="link">Link</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
              <input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Brief description..." />
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Uploading..." : "Upload"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : materials.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No materials uploaded yet</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {materials.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                  {typeIcon[m.fileType || ""] || "📎"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{m.title}</h3>
                  <p className="text-sm text-indigo-600">{m.subjectName} • {m.className} - {m.sectionName}</p>
                  {m.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
                  <p className="text-xs text-gray-400 mt-2">{new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
