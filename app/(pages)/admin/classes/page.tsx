"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";

interface Section {
  id: string;
  name: string;
  classTeacher: { id: string; name: string } | null;
  _count: { students: number };
  teacherAssignments: Array<{
    id: string;
    teacher: { id: string; name: string };
    subject: { id: string; name: string };
  }>;
}

interface ClassData {
  id: string;
  name: string;
  displayOrder: number;
  sections: Section[];
}

interface Subject {
  id: string;
  name: string;
  code: string | null;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

type ModalType = "class" | "section" | "subject" | null;

export default function AdminClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [modalType, setModalType] = useState<ModalType>(null);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newClassId, setNewClassId] = useState("");
  const [newClassTeacherId, setNewClassTeacherId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Expanded class
  const [expandedClassId, setExpandedClassId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/classes");
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        setSubjects(data.subjects || []);
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return toast.error("Name is required");
    setSubmitting(true);
    try {
      const body: any = { type: modalType, name: newName.trim() };
      if (modalType === "section") {
        if (!newClassId) return toast.error("Select a class");
        body.classId = newClassId;
        body.classTeacherId = newClassTeacherId || undefined;
      }
      if (modalType === "subject") {
        body.code = newCode.trim() || undefined;
      }

      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(`${modalType} created!`);
        setModalType(null);
        setNewName("");
        setNewCode("");
        setNewClassId("");
        setNewClassTeacherId("");
        await fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create");
      }
    } catch { toast.error("Network error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (type: string, id: string, name: string) => {
    if (!(await sweetConfirm(`Delete ${type} "${name}"? This will also delete all related data.`))) return;
    try {
      const res = await fetch(`/api/admin/classes?type=${type}&id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`${type} deleted`);
        await fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete");
      }
    } catch { toast.error("Network error"); }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes & Sections</h1>
          <p className="text-gray-600 mt-1">Manage your institution&apos;s academic structure</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalType("class")}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-sm font-medium">
            + Class
          </button>
          <button onClick={() => setModalType("section")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            + Section
          </button>
          <button onClick={() => setModalType("subject")}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            + Subject
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Total Classes</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{classes.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Total Sections</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {classes.reduce((sum, c) => sum + c.sections.length, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Total Subjects</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{subjects.length}</p>
        </div>
      </div>

      {/* Subjects List */}
      {subjects.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Subjects</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm border border-purple-100">
                <span className="font-medium">{s.name}</span>
                {s.code && <span className="text-purple-400">({s.code})</span>}
                <button onClick={() => handleDelete("subject", s.id, s.name)}
                  className="ml-1 text-purple-400 hover:text-red-500">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Classes List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
        </div>
      ) : classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-lg font-medium text-gray-700">No classes yet</p>
          <p className="text-gray-500 mt-1">Create your first class to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Class Header */}
              <div
                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedClassId(expandedClassId === cls.id ? null : cls.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-black text-white p-2 rounded-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                    <p className="text-sm text-gray-500">{cls.sections.length} section(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={(e) => { e.stopPropagation(); handleDelete("class", cls.id, cls.name); }}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${expandedClassId === cls.id ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Sections */}
              {expandedClassId === cls.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-5">
                  {cls.sections.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No sections in this class. Create one to get started.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {cls.sections.map((section) => (
                        <div key={section.id} className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">Section {section.name}</h4>
                              <p className="text-sm text-gray-500">{section._count.students} students</p>
                            </div>
                            <button onClick={() => handleDelete("section", section.id, section.name)}
                              className="p-1 text-gray-400 hover:text-red-500">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          {section.classTeacher && (
                            <p className="text-xs text-amber-600 mb-2">
                              👨‍🏫 Class Teacher: {section.classTeacher.name}
                            </p>
                          )}
                          {section.teacherAssignments.length > 0 && (
                            <div className="space-y-1">
                              {section.teacherAssignments.map((ta) => (
                                <div key={ta.id} className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="font-medium">{ta.subject.name}</span>
                                  <span>→</span>
                                  <span>{ta.teacher.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              Create {modalType}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder={modalType === "class" ? "e.g. Class 1" : modalType === "section" ? "e.g. A" : "e.g. Mathematics"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" />
              </div>

              {modalType === "section" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select value={newClassId} onChange={(e) => setNewClassId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black">
                      <option value="">Select class</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher (optional)</label>
                    <select value={newClassTeacherId} onChange={(e) => setNewClassTeacherId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black">
                      <option value="">No class teacher</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              {modalType === "subject" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code (optional)</label>
                  <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)}
                    placeholder="e.g. MATH101"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalType(null); setNewName(""); setNewCode(""); setNewClassId(""); setNewClassTeacherId(""); }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={submitting}
                className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50">
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
