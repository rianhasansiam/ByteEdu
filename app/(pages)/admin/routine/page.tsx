"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";

interface Routine {
  id: string; className: string; sectionName: string; sectionId: string;
  subjectName: string; teacherName: string; dayOfWeek: number;
  startTime: string; endTime: string; roomNumber: string | null;
}

interface Section { id: string; name: string; class: { name: string } }
interface Subject { id: string; name: string }
interface Teacher { id: string; name: string }

export default function AdminRoutinePage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ sectionId: "", subjectId: "", teacherId: "", dayOfWeek: "0", startTime: "", endTime: "", roomNumber: "" });
  const [saving, setSaving] = useState(false);
  const [filterDay, setFilterDay] = useState<number | null>(null);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const fetchData = async () => {
    setLoading(true);
    const [routineRes, sectionRes, subjectRes, teacherRes] = await Promise.all([
      fetch("/api/admin/routine").then((r) => r.json()),
      fetch("/api/admin/sections").then((r) => r.json()),
      fetch("/api/admin/subjects").then((r) => r.json()),
      fetch("/api/admin/teachers").then((r) => r.json()),
    ]);
    setRoutines(routineRes.routines || []);
    setSections(sectionRes.sections || []);
    setSubjects(subjectRes.subjects || []);
    setTeachers(teacherRes.teachers || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.sectionId || !form.subjectId || !form.teacherId || !form.startTime || !form.endTime) {
      toast.error("Fill all required fields"); return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/routine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success("Routine slot added");
      setShowForm(false);
      setForm({ sectionId: "", subjectId: "", teacherId: "", dayOfWeek: "0", startTime: "", endTime: "", roomNumber: "" });
      fetchData();
    } else {
      const d = await res.json();
      toast.error(d.error || "Failed");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await sweetConfirm("Delete this routine slot?"))) return;
    const res = await fetch(`/api/admin/routine?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchData(); } else toast.error("Failed");
  };

  const filtered = filterDay !== null ? routines.filter((r) => r.dayOfWeek === filterDay) : routines;
  const grouped = dayNames.map((day, i) => ({
    day,
    index: i,
    items: filtered.filter((r) => r.dayOfWeek === i),
  })).filter((g) => filterDay !== null ? g.index === filterDay : g.items.length > 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Class Routine</h1>
          <p className="text-gray-500 mt-1">Manage weekly class timetables</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800">
          {showForm ? "Cancel" : "+ Add Slot"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Routine Slot</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section*</label>
              <select value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select section</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.class.name} - {s.name}</option>)}
              </select>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher*</label>
              <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="">Select teacher</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day*</label>
              <select value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm">
                {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time*</label>
              <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time*</label>
              <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
              <input value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Room number" />
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="mt-4 px-6 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-50">
            {saving ? "Adding..." : "Add Slot"}
          </button>
        </div>
      )}

      {/* Day Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilterDay(null)}
          className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${filterDay === null ? "bg-black text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}>
          All Days
        </button>
        {dayNames.map((d, i) => (
          <button key={i} onClick={() => setFilterDay(i)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${filterDay === i ? "bg-black text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}>
            {d}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : grouped.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No routine slots yet</div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.index}>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{group.day}</h3>
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Teacher</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Room</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {group.items.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{r.startTime} - {r.endTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.className} - {r.sectionName}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{r.subjectName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{r.teacherName}</td>
                        <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{r.roomNumber || "—"}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
