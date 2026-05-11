"use client";

import { useEffect, useState } from "react";
import { exportToCsv } from "@/lib/exportCsv";

interface Result {
  id: string; subjectName: string; subjectCode: string | null; marks: number | null;
  maxMarks: number; examType: string; grade: string; notes: string | null; date: string;
}

export default function StudentResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const q = filter ? `?examType=${filter}` : "";
    fetch(`/api/student/results${q}`)
      .then((r) => r.json())
      .then((d) => setResults(d.results || []))
      .finally(() => setLoading(false));
  }, [filter]);

  const gradeColor: Record<string, string> = {
    "A+": "text-emerald-600 bg-emerald-50", A: "text-emerald-600 bg-emerald-50",
    "A-": "text-green-600 bg-green-50", B: "text-blue-600 bg-blue-50",
    C: "text-amber-600 bg-amber-50", D: "text-orange-600 bg-orange-50",
    F: "text-red-600 bg-red-50",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Results</h1>
          <p className="text-gray-500 mt-1">Your academic performance</p>
        </div>
        <button
          onClick={() => exportToCsv(results, "my_results", [
            { key: "subjectName", label: "Subject" },
            { key: "marks", label: "Marks" },
            { key: "maxMarks", label: "Max Marks" },
            { key: "grade", label: "Grade" },
            { key: "examType", label: "Type" },
            { key: "date", label: "Date" },
          ])}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          disabled={results.length === 0}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6 flex gap-2">
        {["", "exam", "quiz", "assignment"].map((t) => (
          <button key={t} onClick={() => { setFilter(t); setLoading(true); }}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${filter === t ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
            {t === "" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No results found.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Marks</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Grade</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{r.subjectName}</p>
                    {r.subjectCode && <p className="text-xs text-gray-400">{r.subjectCode}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {r.marks !== null ? `${r.marks} / ${r.maxMarks}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${gradeColor[r.grade] || "bg-gray-100 text-gray-700"}`}>
                      {r.grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell capitalize">{r.examType}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
