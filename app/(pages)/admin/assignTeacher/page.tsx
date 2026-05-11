"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";

interface Assignment {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
}

interface ClassData {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

export default function AdminAssignTeacherPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/assignTeacher");
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        setTeachers(data.teachers || []);
        setSubjects(data.subjects || []);
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const sections = classes.find((c) => c.id === selectedClass)?.sections || [];

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSection || !selectedSubject) {
      toast.error("Please select teacher, section, and subject");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/assignTeacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: selectedTeacher, sectionId: selectedSection, subjectId: selectedSubject }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Teacher assigned successfully!");
        setAssignments((prev) => [data.assignment, ...prev]);
        setSelectedTeacher("");
        setSelectedSubject("");
      } else {
        toast.error(data.error || "Failed to assign");
      }
    } catch { toast.error("Network error"); }
    finally { setSubmitting(false); }
  };

  const handleRemove = async (id: string) => {
    if (!(await sweetConfirm("Remove this assignment?"))) return;
    try {
      const res = await fetch(`/api/admin/assignTeacher?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Assignment removed");
        setAssignments((prev) => prev.filter((a) => a.id !== id));
      } else { toast.error("Failed to remove"); }
    } catch { toast.error("Network error"); }
  };

  const filteredAssignments = selectedSection
    ? assignments.filter((a) => a.sectionId === selectedSection)
    : selectedClass
    ? assignments.filter((a) => a.classId === selectedClass)
    : assignments;

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Assign Teacher</h1>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assign Teacher</h1>
        <p className="text-gray-600 mt-1">Assign teachers to classes, sections, and subjects</p>
      </div>

      {/* Assignment Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New Assignment</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black">
              <option value="">Select Class</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" disabled={!selectedClass}>
              <option value="">Select Section</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black">
              <option value="">Select Teacher</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black">
              <option value="">Select Subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ""}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleAssign} disabled={submitting || !selectedTeacher || !selectedSection || !selectedSubject}
          className="mt-4 px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {submitting ? "Assigning..." : "Assign Teacher"}
        </button>
      </div>

      {/* Assignments Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Current Assignments ({filteredAssignments.length})</h2>
        </div>
        {filteredAssignments.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Teacher</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Subject</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Class</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Section</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAssignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{a.teacherName}</p>
                    <p className="text-xs text-gray-500">{a.teacherEmail}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{a.subjectName} {a.subjectCode ? `(${a.subjectCode})` : ""}</td>
                  <td className="px-6 py-4 text-gray-700">{a.className}</td>
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{a.sectionName}</span></td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleRemove(a.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            <p>No teacher assignments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
