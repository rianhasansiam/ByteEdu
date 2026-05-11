"use client";

import Image from "next/image";
import { useState } from "react";

export interface Student {
  id: string;
  name: string;
  email?: string | null;
  roll: string | null;
  phone?: string | null;
  picture?: string | null;
  section?: {
    id: string;
    name: string;
    class: {
      id: string;
      name: string;
    };
  } | null;
}

interface StudentTableProps {
  students: Student[];
  onStudentClick?: (student: Student) => void;
  showSection?: boolean;
  loading?: boolean;
}

export function StudentTable({ students, onStudentClick, showSection = true, loading = false }: StudentTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading students...</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-8 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="mt-2 text-gray-500">No students found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Student</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Roll</th>
              {showSection && (
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Class/Section</th>
              )}
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Contact</th>
              {onStudentClick && (
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Action</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((student) => (
              <tr
                key={student.id}
                className={`hover:bg-gray-50 transition-colors ${onStudentClick ? "cursor-pointer" : ""}`}
                onClick={() => onStudentClick?.(student)}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {student.picture ? (
                      <Image
                        src={student.picture}
                        alt={student.name}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-700 font-medium">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">{student.name}</p>
                      {student.email && (
                        <p className="text-xs text-gray-500">{student.email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                    {student.roll || "-"}
                  </span>
                </td>
                {showSection && (
                  <td className="py-3 px-4">
                    {student.section ? (
                      <span className="text-gray-600">
                        {student.section.class.name} - {student.section.name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not assigned</span>
                    )}
                  </td>
                )}
                <td className="py-3 px-4">
                  <span className="text-gray-600">{student.phone || "-"}</span>
                </td>
                {onStudentClick && (
                  <td className="py-3 px-4 text-right">
                    <button className="text-emerald-600 hover:text-emerald-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  total: number;
  limit: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, total, limit }: PaginationProps) {
  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white rounded-lg border border-gray-200">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{startItem}</span> to{" "}
        <span className="font-medium">{endItem}</span> of{" "}
        <span className="font-medium">{total}</span> students
      </p>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-1 text-sm rounded-md ${
                currentPage === pageNum
                  ? "bg-emerald-600 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {pageNum}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}

interface StudentDetailModalProps {
  student: Student & {
    studentAttendances?: Array<{
      id: string;
      date: Date | string;
      status: string;
      remarks: string | null;
    }>;
  };
  onClose: () => void;
}

export function StudentDetailModal({ student, onClose }: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "attendance">("info");

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {student.picture ? (
              <Image
                src={student.picture}
                alt={student.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-700 text-2xl font-medium">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-800">{student.name}</h2>
              <p className="text-gray-500">
                {student.section ? `${student.section.class.name} - ${student.section.name}` : "No section"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "info"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Information
            </button>
            <button
              onClick={() => setActiveTab("attendance")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "attendance"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Attendance History
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {activeTab === "info" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Roll Number</p>
                <p className="mt-1 font-medium text-gray-800">{student.roll || "-"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="mt-1 font-medium text-gray-800">{student.email || "-"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                <p className="mt-1 font-medium text-gray-800">{student.phone || "-"}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Class</p>
                <p className="mt-1 font-medium text-gray-800">
                  {student.section ? student.section.class.name : "-"}
                </p>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div>
              {student.studentAttendances && student.studentAttendances.length > 0 ? (
                <div className="space-y-2">
                  {student.studentAttendances.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-600">
                        {new Date(record.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span
                        className={`px-3 py-1 text-sm rounded-full ${
                          record.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-700"
                            : record.status === "ABSENT"
                            ? "bg-rose-100 text-rose-700"
                            : record.status === "LATE"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No attendance records found</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
