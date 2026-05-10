"use client";

import { useEffect, useState } from "react";
import { exportToCsv } from "@/lib/exportCsv";

interface AttendanceRecord {
  id: string; date: string; status: string; remarks: string | null;
  className: string; sectionName: string; teacherName: string;
}

interface Stats { total: number; present: number; absent: number; late: number; excused: number; percentage: string; }

export default function StudentAttendance() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: "0" });
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/student/attendance?month=${month}`);
    const data = await res.json();
    setRecords(data.records || []);
    setStats(data.stats || { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: "0" });
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [month]);

  const statusBadge: Record<string, string> = {
    PRESENT: "bg-emerald-100 text-emerald-700",
    ABSENT: "bg-red-100 text-red-700",
    LATE: "bg-amber-100 text-amber-700",
    EXCUSED: "bg-blue-100 text-blue-700",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-500 mt-1">Track your attendance history</p>
        </div>
        <button
          onClick={() => exportToCsv(records, "my_attendance", [
            { key: "date", label: "Date" },
            { key: "status", label: "Status" },
            { key: "className", label: "Class" },
            { key: "sectionName", label: "Section" },
            { key: "teacherName", label: "Teacher" },
            { key: "remarks", label: "Remarks" },
          ])}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          disabled={records.length === 0}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Percentage</p>
          <p className="text-2xl font-bold text-indigo-600">{stats.percentage}%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Present</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Absent</p>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Late</p>
          <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Excused</p>
          <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <label className="text-sm text-gray-500 mr-3">Month:</label>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No attendance records found for this month.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Teacher</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[r.status] || "bg-gray-100"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 hidden md:table-cell">{r.teacherName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">{r.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
