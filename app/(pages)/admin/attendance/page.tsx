"use client";

import { useEffect, useState } from "react";
import { exportToCsv } from "@/lib/exportCsv";

interface AttendanceRecord {
  id: string; studentName: string; studentRoll: string | null;
  className: string; sectionName: string; teacherName: string;
  status: string; date: string; remarks: string | null;
}

interface ClassData {
  id: string; name: string;
  sections: { id: string; name: string }[];
}

interface Stats {
  total: number; present: number; absent: number; late: number; excused: number;
}

export default function AdminAttendancePage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, present: 0, absent: 0, late: 0, excused: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedSection) params.set("sectionId", selectedSection);
      if (selectedDate) params.set("date", selectedDate);
      const res = await fetch(`/api/admin/attendance?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
        setRecords(data.records || []);
        setStats(data.stats || { total: 0, present: 0, absent: 0, late: 0, excused: 0 });
      }
    } catch (error) { console.error("Error:", error); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedSection, selectedDate]);

  const sections = classes.find((c) => c.id === selectedClass)?.sections || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PRESENT": return "bg-green-100 text-green-700";
      case "ABSENT": return "bg-red-100 text-red-700";
      case "LATE": return "bg-yellow-100 text-yellow-700";
      case "EXCUSED": return "bg-blue-100 text-blue-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const presentPct = stats.total > 0 ? ((stats.present / stats.total) * 100).toFixed(1) : "0";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1">View attendance records across your institution</p>
        </div>
        <button
          onClick={() => exportToCsv(records, "attendance", [
            { key: "studentName", label: "Student" },
            { key: "studentRoll", label: "Roll" },
            { key: "className", label: "Class" },
            { key: "sectionName", label: "Section" },
            { key: "status", label: "Status" },
            { key: "date", label: "Date" },
            { key: "teacherName", label: "Teacher" },
          ])}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          disabled={records.length === 0}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Total Records</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Present</p>
          <p className="text-2xl font-bold text-green-600">{stats.present}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Absent</p>
          <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Late</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.late}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">Attendance Rate</p>
          <p className="text-2xl font-bold text-blue-600">{presentPct}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
            <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {selectedClass && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Section</label>
              <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                <option value="">All Sections</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Attendance Records ({records.length})</h2>
        </div>
        {loading ? (
          <div className="p-8 animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-10 bg-gray-200 rounded"></div>)}
          </div>
        ) : records.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Student</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Roll</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Class</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Section</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Teacher</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{r.studentName}</td>
                  <td className="px-6 py-4 text-gray-600">{r.studentRoll || "-"}</td>
                  <td className="px-6 py-4 text-gray-700">{r.className}</td>
                  <td className="px-6 py-4 text-gray-700">{r.sectionName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{r.teacherName}</td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{new Date(r.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            <p>No attendance records found for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
