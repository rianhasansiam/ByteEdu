"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";

interface Exam {
  id: string; name: string; subjectName: string; className: string; sectionName: string;
  date: string; startTime: string | null; endTime: string | null; roomNumber: string | null;
  syllabus: string | null; instructions: string | null;
}

interface Section { id: string; name: string; class: { name: string } }
interface Subject { id: string; name: string }

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", subjectId: "", sectionId: "", date: "", startTime: "", endTime: "", roomNumber: "", syllabus: "", instructions: "" });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [examRes, sectionRes, subjectRes] = await Promise.all([
      fetch("/api/admin/exams").then((r) => r.json()),
      fetch("/api/admin/sections").then((r) => r.json()),
      fetch("/api/admin/subjects").then((r) => r.json()),
    ]);
    setExams(examRes.exams || []);
    setSections(sectionRes.sections || []);
    setSubjects(subjectRes.subjects || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.subjectId || !form.sectionId || !form.date) {
      toast.error("Fill required fields"); return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Exam scheduled");
      setShowForm(false);
      setForm({ name: "", subjectId: "", sectionId: "", date: "", startTime: "", endTime: "", roomNumber: "", syllabus: "", instructions: "" });
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await sweetConfirm("Delete this exam?"))) return;
    const res = await fetch(`/api/admin/exams?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchData(); } else toast.error("Failed");
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = exams.filter((e) => new Date(e.date) >= today);
  const past = exams.filter((e) => new Date(e.date) < today);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exam Schedule</h1>
          <p className="text-gray-500 mt-1">Manage examination schedules</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
          {showForm ? "Cancel" : "+ Schedule Exam"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Exam</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name*</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="e.g., Mid Term" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject*</label>
              <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section*</label>
              <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select section</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.class.name} - {s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date*</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Room number" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Syllabus</label>
              <input value={form.syllabus} onChange={(e) => setForm({ ...form, syllabus: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Topics covered" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
              <input value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Special instructions" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
            {saving ? "Scheduling..." : "Schedule Exam"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : exams.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No exams scheduled</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming ({upcoming.length})</h2>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Time</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {upcoming.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{e.subjectName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{e.className} - {e.sectionName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{new Date(e.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{e.startTime || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">Past ({past.length})</h2>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden opacity-60">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Exam</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {past.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 text-sm text-gray-700">{e.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{e.subjectName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{e.className} - {e.sectionName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{new Date(e.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
