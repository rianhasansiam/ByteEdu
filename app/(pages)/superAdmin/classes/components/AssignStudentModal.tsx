"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Student } from "./types";

interface AssignStudentModalProps {
  isOpen: boolean;
  sectionId: string;
  institutionStudents: Student[];
  assignedStudentIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignStudentModal({
  isOpen,
  sectionId,
  institutionStudents,
  assignedStudentIds,
  onClose,
  onSuccess,
}: AssignStudentModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [loading, setLoading] = useState(false);

  // Filter students not in this section and without a section
  const availableStudents = institutionStudents.filter(
    (s) => !assignedStudentIds.has(s.id) && !s.sectionId
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast.error("Please select a student");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/superadmin/students/assign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: selectedStudentId,
            sectionId,
            action: "assign",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to assign student");
        return;
      }

      toast.success("Student assigned successfully");
      setSelectedStudentId("");
      onSuccess();
    } catch (error) {
      console.error("Error assigning student:", error);
      toast.error("Failed to assign student");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Assign Student to Section</h2>

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Student *
            </label>
            {availableStudents.length === 0 ? (
              <div className="p-3 text-center border border-gray-200 rounded-md bg-gray-50">
                <p className="text-sm text-gray-500">
                  No available students to assign
                </p>
              </div>
            ) : (
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">-- Select Student --</option>
                {availableStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} {student.roll ? `(Roll: ${student.roll})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              disabled={loading || availableStudents.length === 0}
            >
              {loading ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
