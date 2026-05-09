"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Student } from "./types";

interface StudentListProps {
  sectionId: string;
  students: Student[];
  onStudentRemoved: () => void;
}

export default function StudentList({
  sectionId,
  students,
  onStudentRemoved,
}: StudentListProps) {
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemoveStudent = async (studentId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to remove this student from the section?"
      )
    )
      return;

    setRemoving(studentId);
    try {
      const response = await fetch(
        "/api/superadmin/students/assign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId,
            action: "remove",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to remove student");
        return;
      }

      toast.success("Student removed from section");
      onStudentRemoved();
    } catch (error) {
      console.error("Error removing student:", error);
      toast.error("Failed to remove student");
    } finally {
      setRemoving(null);
    }
  };

  if (students.length === 0) {
    return (
      <div className="p-3 text-center border border-dashed border-gray-200 rounded-lg">
        <p className="text-sm text-gray-500">No students assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {students.map((student) => (
        <div
          key={student.id}
          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
        >
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{student.name}</p>
            <p className="text-xs text-gray-500">{student.email}</p>
            {student.roll && (
              <p className="text-xs text-gray-600">Roll: {student.roll}</p>
            )}
          </div>
          <button
            onClick={() => handleRemoveStudent(student.id)}
            disabled={removing === student.id}
            className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
