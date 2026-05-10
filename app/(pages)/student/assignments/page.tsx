"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Assignment {
  id: string; title: string; description: string | null; subjectName: string; teacherName: string;
  dueDate: string; createdAt: string; status: string;
  submission: { id: string; submittedAt: string; isLate: boolean; grade: string | null; feedback: string | null } | null;
}

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [activeSubmit, setActiveSubmit] = useState<string | null>(null);

  const fetchData = () => {
    fetch("/api/student/assignments")
      .then((r) => r.json())
      .then((d) => setAssignments(d.assignments || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (assignmentId: string) => {
    if (!content.trim()) { toast.error("Please enter your answer"); return; }
    setSubmitting(assignmentId);
    try {
      const res = await fetch("/api/student/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, content }),
      });
      if (res.ok) {
        toast.success("Assignment submitted!");
        setContent("");
        setActiveSubmit(null);
        fetchData();
      } else {
        toast.error("Failed to submit");
      }
    } catch { toast.error("Error submitting"); }
    setSubmitting(null);
  };

  const statusStyles: Record<string, string> = {
    Pending: "bg-amber-100 text-amber-700",
    Submitted: "bg-emerald-100 text-emerald-700",
    "Late Submitted": "bg-orange-100 text-orange-700",
    Checked: "bg-blue-100 text-blue-700",
    Overdue: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
        <p className="text-gray-500 mt-1">View and submit your homework</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No assignments yet</div>
      ) : (
        <div className="space-y-4">
          {assignments.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.title}</h3>
                    <p className="text-sm text-indigo-600">{a.subjectName} • {a.teacherName}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[a.status] || "bg-gray-100"}`}>
                    {a.status}
                  </span>
                </div>
                {a.description && <p className="text-sm text-gray-600 mb-3">{a.description}</p>}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Due: {new Date(a.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span>Posted: {new Date(a.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Submission feedback */}
                {a.submission?.grade && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Grade: {a.submission.grade}</p>
                    {a.submission.feedback && <p className="text-sm text-blue-700 mt-1">{a.submission.feedback}</p>}
                  </div>
                )}

                {/* Submit form */}
                {!a.submission && (
                  <div className="mt-4">
                    {activeSubmit === a.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Write your answer here..."
                          className="w-full border rounded-lg p-3 text-sm resize-none h-24 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSubmit(a.id)} disabled={submitting === a.id}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50">
                            {submitting === a.id ? "Submitting..." : "Submit"}
                          </button>
                          <button onClick={() => { setActiveSubmit(null); setContent(""); }}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setActiveSubmit(a.id)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                        Submit Assignment
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
