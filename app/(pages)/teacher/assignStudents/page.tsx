"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Section {
  id: string;
  name: string;
  className: string;
  classId: string;
  studentCount: number;
  isClassTeacher: boolean;
}

interface UnassignedStudent {
  id: string;
  name: string;
  email: string;
  roll: string | null;
}

export default function TeacherAssignStudentsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [unassignedStudents, setUnassignedStudents] = useState<UnassignedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Selected section for assignment
  const [selectedSectionId, setSelectedSectionId] = useState("");
  // Selected students for bulk assignment
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  // Search
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/teacher/assignStudents");
      if (res.ok) {
        const data = await res.json();
        setSections(data.sections || []);
        setUnassignedStudents(data.unassignedStudents || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (studentId: string) => {
    if (!selectedSectionId) return toast.error("Please select a section first");
    setSubmitting(studentId);
    try {
      const res = await fetch("/api/teacher/assignStudents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, sectionId: selectedSectionId, action: "assign" }),
      });
      if (res.ok) {
        toast.success("Student assigned!");
        setSelectedStudentIds((prev) => { const next = new Set(prev); next.delete(studentId); return next; });
        await fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed");
      }
    } catch { toast.error("Network error"); }
    finally { setSubmitting(null); }
  };

  const handleBulkAssign = async () => {
    if (!selectedSectionId) return toast.error("Please select a section first");
    if (selectedStudentIds.size === 0) return toast.error("Select at least one student");

    setSubmitting("bulk");
    let success = 0;
    let failed = 0;

    for (const studentId of selectedStudentIds) {
      try {
        const res = await fetch("/api/teacher/assignStudents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId, sectionId: selectedSectionId, action: "assign" }),
        });
        if (res.ok) success++;
        else failed++;
      } catch { failed++; }
    }

    if (success > 0) toast.success(`${success} student(s) assigned`);
    if (failed > 0) toast.error(`${failed} assignment(s) failed`);

    setSelectedStudentIds(new Set());
    await fetchData();
    setSubmitting(null);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedStudentIds.size === filteredStudents.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const filteredStudents = unassignedStudents.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.roll && s.roll.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Assign Students</h1>
        <p className="text-gray-500 mt-1">Assign unassigned students to your sections</p>
      </div>

      {/* Section Selector */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">1. Select a Section</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setSelectedSectionId(section.id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedSectionId === section.id
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
              }`}
            >
              <p className="font-semibold text-gray-800">
                {section.className} - {section.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">{section.studentCount} students</p>
              {section.isClassTeacher && (
                <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                  Class Teacher
                </span>
              )}
            </button>
          ))}
        </div>
        {sections.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-4">No sections assigned to you</p>
        )}
      </div>

      {/* Unassigned Students */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">2. Select Students to Assign</h3>
            <p className="text-xs text-gray-500 mt-1">
              {unassignedStudents.length} unassigned student(s) in your institution
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {selectedStudentIds.size > 0 && (
              <button
                onClick={handleBulkAssign}
                disabled={submitting === "bulk" || !selectedSectionId}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting === "bulk"
                  ? "Assigning..."
                  : `Assign ${selectedStudentIds.size} Selected`}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-2 text-gray-500">
              {unassignedStudents.length === 0
                ? "All students are assigned to sections"
                : "No students match your search"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Roll</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                        className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="text-emerald-700 font-medium text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium text-gray-800">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 text-sm">{student.email}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded font-mono">
                        {student.roll || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleAssign(student.id)}
                        disabled={submitting === student.id || !selectedSectionId}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {submitting === student.id ? "..." : "Assign"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
