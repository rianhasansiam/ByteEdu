"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Student {
  id: string; name: string; email: string; roll: string | null;
  phone: string | null; sectionId: string | null;
  sectionName: string | null; classId: string | null; className: string | null;
}

interface ClassData {
  id: string; name: string;
  sections: { id: string; name: string; _count: { students: number } }[];
}

export default function AdminAssignStudentPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [viewMode, setViewMode] = useState<"unassigned" | "assigned">("unassigned");

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/assignStudent");
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        setStudents(data.students || []);
      }
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const sections = classes.find((c) => c.id === selectedClass)?.sections || [];
  const unassigned = students.filter((s) => !s.sectionId);
  const assigned = students.filter((s) => s.sectionId);
  const displayStudents = viewMode === "unassigned" ? unassigned
    : selectedSection ? assigned.filter((s) => s.sectionId === selectedSection)
    : selectedClass ? assigned.filter((s) => s.classId === selectedClass) : assigned;

  const handleAssign = async (studentId: string) => {
    if (!selectedSection) { toast.error("Select a section first"); return; }
    setSubmitting(studentId);
    try {
      const res = await fetch("/api/admin/assignStudent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, sectionId: selectedSection }),
      });
      if (res.ok) {
        toast.success("Student assigned!");
        await fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed");
      }
    } catch { toast.error("Network error"); }
    finally { setSubmitting(null); }
  };

  const handleRemove = async (studentId: string) => {
    if (!confirm("Remove student from section?")) return;
    setSubmitting(studentId);
    try {
      const res = await fetch(`/api/admin/assignStudent?studentId=${studentId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Student removed from section");
        await fetchData();
      } else { toast.error("Failed"); }
    } catch { toast.error("Network error"); }
    finally { setSubmitting(null); }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Assign Student</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assign Student</h1>
        <p className="text-gray-600 mt-1">Assign students to classes and sections</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-2xl font-bold text-gray-900">{students.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Unassigned</p>
          <p className="text-2xl font-bold text-orange-600">{unassigned.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Assigned</p>
          <p className="text-2xl font-bold text-green-600">{assigned.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Classes</p>
          <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex gap-2">
            <button onClick={() => setViewMode("unassigned")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "unassigned" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Unassigned ({unassigned.length})
            </button>
            <button onClick={() => setViewMode("assigned")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "assigned" ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              Assigned ({assigned.length})
            </button>
          </div>
          <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedClass && (
            <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">All Sections</option>
              {sections.map((s) => <option key={s.id} value={s.id}>{s.name} ({s._count.students})</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b"><h2 className="text-lg font-semibold text-gray-900">{viewMode === "unassigned" ? "Unassigned" : "Assigned"} Students ({displayStudents.length})</h2></div>
        {displayStudents.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Roll</th>
                {viewMode === "assigned" && <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Class / Section</th>}
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayStudents.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{s.email}</td>
                  <td className="px-6 py-4 text-gray-600">{s.roll || "-"}</td>
                  {viewMode === "assigned" && (
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">{s.className} — {s.sectionName}</span>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {viewMode === "unassigned" ? (
                      <button onClick={() => handleAssign(s.id)} disabled={!selectedSection || submitting === s.id}
                        className="px-3 py-1 bg-black text-white text-sm rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting === s.id ? "..." : "Assign"}
                      </button>
                    ) : (
                      <button onClick={() => handleRemove(s.id)} disabled={submitting === s.id}
                        className="text-red-600 hover:text-red-800 text-sm font-medium">
                        {submitting === s.id ? "..." : "Remove"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No {viewMode} students found</p>
          </div>
        )}
      </div>
    </div>
  );
}
