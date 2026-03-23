"use client";

import { useState } from "react";
import toast from "react-hot-toast";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface Student {
  studentId: string;
  name: string;
  roll: string | null;
  status: AttendanceStatus | null;
  remarks: string | null;
}

interface AttendanceFormProps {
  sectionId: string;
  sectionName: string;
  className: string;
  date: string;
  students: Student[];
  attendanceExists: boolean;
  onSubmit: (records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>) => Promise<void>;
  onDateChange: (date: string) => void;
}

export function AttendanceForm({
  sectionId,
  sectionName,
  className,
  date,
  students,
  attendanceExists,
  onSubmit,
  onDateChange,
}: AttendanceFormProps) {
  const [attendance, setAttendance] = useState<Map<string, { status: AttendanceStatus; remarks: string }>>(
    () => {
      const map = new Map();
      students.forEach((s) => {
        map.set(s.studentId, {
          status: s.status || "PRESENT",
          remarks: s.remarks || "",
        });
      });
      return map;
    }
  );
  const [submitting, setSubmitting] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<AttendanceStatus | "">("");

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(studentId) || { status: "PRESENT", remarks: "" };
      newMap.set(studentId, { ...current, status });
      return newMap;
    });
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setAttendance((prev) => {
      const newMap = new Map(prev);
      const current = newMap.get(studentId) || { status: "PRESENT", remarks: "" };
      newMap.set(studentId, { ...current, remarks });
      return newMap;
    });
  };

  const handleBulkStatusChange = (status: AttendanceStatus) => {
    setBulkStatus(status);
    setAttendance((prev) => {
      const newMap = new Map();
      students.forEach((s) => {
        const current = prev.get(s.studentId) || { status: "PRESENT", remarks: "" };
        newMap.set(s.studentId, { ...current, status });
      });
      return newMap;
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const records = Array.from(attendance.entries()).map(([studentId, data]) => ({
        studentId,
        status: data.status,
        remarks: data.remarks || undefined,
      }));
      await onSubmit(records);
      toast.success(attendanceExists ? "Attendance updated successfully!" : "Attendance submitted successfully!");
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusCount = (status: AttendanceStatus) => {
    return Array.from(attendance.values()).filter((a) => a.status === status).length;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {className} - Section {sectionName}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {students.length} students enrolled
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => onDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            {attendanceExists && (
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm rounded-full">
                Already Recorded
              </span>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-emerald-600">{getStatusCount("PRESENT")}</p>
            <p className="text-xs text-emerald-600">Present</p>
          </div>
          <div className="p-3 bg-rose-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-rose-600">{getStatusCount("ABSENT")}</p>
            <p className="text-xs text-rose-600">Absent</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-amber-600">{getStatusCount("LATE")}</p>
            <p className="text-xs text-amber-600">Late</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{getStatusCount("EXCUSED")}</p>
            <p className="text-xs text-blue-600">Excused</p>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm text-gray-500">Mark all as:</span>
          {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleBulkStatusChange(status)}
              className={`px-3 py-1 text-sm rounded-lg border transition-colors ${
                bulkStatus === status
                  ? status === "PRESENT"
                    ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                    : status === "ABSENT"
                    ? "bg-rose-100 border-rose-300 text-rose-700"
                    : status === "LATE"
                    ? "bg-amber-100 border-amber-300 text-amber-700"
                    : "bg-blue-100 border-blue-300 text-blue-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Roll</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student Name</th>
                <th className="text-center py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const record = attendance.get(student.studentId);
                return (
                  <tr key={student.studentId} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded font-mono">
                        {student.roll || "-"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-800">{student.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map((status) => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(student.studentId, status)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                              record?.status === status
                                ? status === "PRESENT"
                                  ? "bg-emerald-500 text-white ring-2 ring-emerald-200"
                                  : status === "ABSENT"
                                  ? "bg-rose-500 text-white ring-2 ring-rose-200"
                                  : status === "LATE"
                                  ? "bg-amber-500 text-white ring-2 ring-amber-200"
                                  : "bg-blue-500 text-white ring-2 ring-blue-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                            title={status}
                          >
                            {status.charAt(0)}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        value={record?.remarks || ""}
                        onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || students.length === 0}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Submitting...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {attendanceExists ? "Update Attendance" : "Submit Attendance"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface SectionSelectorProps {
  sections: Array<{
    id: string;
    name: string;
    className: string;
    studentCount: number;
    isClassTeacher?: boolean;
  }>;
  selectedSectionId: string | null;
  onSelect: (sectionId: string) => void;
  loading?: boolean;
}

export function SectionSelector({ sections, selectedSectionId, onSelect, loading }: SectionSelectorProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="mt-2 text-gray-500">No sections assigned to you</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Section</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => onSelect(section.id)}
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
    </div>
  );
}
