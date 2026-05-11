"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";

interface TeacherSection { id: string; sectionName: string; className: string; subjectId: string; subjectName: string; }
interface Assignment {
  id: string; title: string; description: string | null; subjectName: string;
  className: string; sectionName: string; dueDate: string; createdAt: string;
  submissionCount: number; totalStudents: number;
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [sections, setSections] = useState<TeacherSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", sectionId: "", subjectId: "", dueDate: "" });
  const [saving, setSaving] = useState(false);
  const [viewSubmissions, setViewSubmissions] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<{ id: string; studentName: string; studentRoll: string | null; content: string | null; submittedAt: string; isLate: boolean; grade: string | null; feedback: string | null }[]>([]);
  const [grading, setGrading] = useState<{ id: string; grade: string; feedback: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [assignRes, secRes] = await Promise.all([
      fetch("/api/teacher/assignments").then((r) => r.json()),
      fetch("/api/teacher/my-sections").then((r) => r.json()),
    ]);
    setAssignments(assignRes.assignments || []);
    const secs: TeacherSection[] = (secRes.sections || []).map((s: { id: string; section: { id: string; name: string; class: { name: string } }; subjectId: string; subject: { name: string } }) => ({
      id: s.section.id,
      sectionName: s.section.name,
      className: s.section.class.name,
      subjectId: s.subjectId,
      subjectName: s.subject.name,
    }));
    setSections(secs);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!form.title || !form.sectionId || !form.subjectId || !form.dueDate) { toast.error("Fill all fields"); return; }
    setSaving(true);
    const res = await fetch("/api/teacher/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { toast.success("Assignment created"); setShowForm(false); setForm({ title: "", description: "", sectionId: "", subjectId: "", dueDate: "" }); fetchData(); }
    else { const d = await res.json(); toast.error(d.error || "Failed"); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await sweetConfirm("Delete this assignment?"))) return;
    const res = await fetch(`/api/teacher/assignments?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Deleted"); fetchData(); } else toast.error("Failed");
  };

  const fetchSubmissions = async (assignmentId: string) => {
    setViewSubmissions(assignmentId);
    const res = await fetch(`/api/teacher/submissions?assignmentId=${assignmentId}`);
    const d = await res.json();
    setSubmissions(d.submissions || []);
  };

  const handleGrade = async () => {
    if (!grading) return;
    const res = await fetch("/api/teacher/submissions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: grading.id, grade: grading.grade, feedback: grading.feedback }),
    });
    if (res.ok) { toast.success("Graded"); setGrading(null); fetchSubmissions(viewSubmissions!); }
    else toast.error("Failed");
  };

  const selectedSection = sections.find((s) => s.id === form.sectionId);
  const availableSubjects = sections.filter((s) => s.id === form.sectionId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-500 mt-1">Create and manage assignments for your classes</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
          {showForm ? "Cancel" : "+ Create Assignment"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">New Assignment</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title*</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Assignment title" />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date*</label>
              <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm h-20 resize-none" placeholder="Assignment instructions..." />
            </div>
          </div>
          <button onClick={handleCreate} disabled={saving}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      )}

      {/* Submissions Modal */}
      {viewSubmissions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setViewSubmissions(null); setGrading(null); }}>
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Submissions ({submissions.length})</h2>
              <button onClick={() => { setViewSubmissions(null); setGrading(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {submissions.length === 0 ? (
                <p className="text-gray-400 text-center">No submissions yet</p>
              ) : submissions.map((s) => (
                <div key={s.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{s.studentName}</p>
                      {s.studentRoll && <p className="text-xs text-gray-400">Roll: {s.studentRoll}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{new Date(s.submittedAt).toLocaleString()}</p>
                      {s.isLate && <span className="text-xs text-orange-600">Late</span>}
                    </div>
                  </div>
                  {s.content && <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg mb-3">{s.content}</p>}
                  {s.grade ? (
                    <div className="p-2 bg-blue-50 rounded text-sm">
                      <span className="font-medium text-blue-700">Grade: {s.grade}</span>
                      {s.feedback && <p className="text-blue-600 mt-1">{s.feedback}</p>}
                    </div>
                  ) : grading?.id === s.id ? (
                    <div className="space-y-2">
                      <input value={grading.grade} onChange={(e) => setGrading({ ...grading, grade: e.target.value })}
                        placeholder="Grade (e.g., A+, 85)" className="w-full border rounded px-3 py-1.5 text-sm" />
                      <textarea value={grading.feedback} onChange={(e) => setGrading({ ...grading, feedback: e.target.value })}
                        placeholder="Feedback..." className="w-full border rounded px-3 py-1.5 text-sm h-16 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={handleGrade} className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">Save</button>
                        <button onClick={() => setGrading(null)} className="px-3 py-1.5 bg-gray-100 rounded text-sm">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setGrading({ id: s.id, grade: "", feedback: "" })}
                      className="text-sm text-blue-600 hover:underline">Grade</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assignment list */}
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-xl" />)}</div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No assignments created yet</div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                  <p className="text-sm text-indigo-600">{a.subjectName} • {a.className} - {a.sectionName}</p>
                  {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>Due: {new Date(a.dueDate).toLocaleDateString()}</span>
                    <span>Submissions: {a.submissionCount}/{a.totalStudents}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => fetchSubmissions(a.id)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
                    View ({a.submissionCount})
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm hover:bg-red-100">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
