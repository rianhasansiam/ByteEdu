"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";

export interface TeacherAssignment {
  id: string;
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  subject: {
    id: string;
    name: string;
    code?: string;
  };
}

interface TeacherListProps {
  sectionId: string;
  assignments: TeacherAssignment[];
  onTeacherRemoved: () => void;
}

export default function TeacherList({
  sectionId,
  assignments,
  onTeacherRemoved,
}: TeacherListProps) {
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemoveTeacher = async (assignmentId: string) => {
    if (!(await sweetConfirm("Are you sure you want to remove this teacher?")))
      return;

    setRemoving(assignmentId);
    try {
      const response = await fetch(
        "/api/superadmin/teachers/assign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignmentId,
            action: "remove",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to remove teacher");
        return;
      }

      toast.success("Teacher removed from section");
      onTeacherRemoved();
    } catch (error) {
      console.error("Error removing teacher:", error);
      toast.error("Failed to remove teacher");
    } finally {
      setRemoving(null);
    }
  };

  if (assignments.length === 0) {
    return (
      <div className="p-3 text-center border border-dashed border-gray-200 rounded-lg bg-white">
        <p className="text-sm text-gray-500">No teachers assigned yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {assignments.map((assignment) => (
        <div
          key={assignment.id}
          className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900">
                {assignment.teacher.name}
              </p>
              <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded">
                {assignment.subject.name}
              </span>
            </div>
            <p className="text-xs text-gray-500">{assignment.teacher.email}</p>
          </div>
          <button
            onClick={() => handleRemoveTeacher(assignment.id)}
            disabled={removing === assignment.id}
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
