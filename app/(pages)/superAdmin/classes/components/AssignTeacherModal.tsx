"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Teacher } from "./types";

export interface Subject {
  id: string;
  name: string;
  code?: string | null;
}

interface AssignTeacherModalProps {
  isOpen: boolean;
  sectionId: string;
  teachers: Teacher[];
  subjects: Subject[];
  assignedTeacherIds: Set<string>;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignTeacherModal({
  isOpen,
  sectionId,
  teachers,
  subjects,
  assignedTeacherIds,
  onClose,
  onSuccess,
}: AssignTeacherModalProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [loading, setLoading] = useState(false);

  const availableTeachers = teachers.filter((t) => !assignedTeacherIds.has(t.id));

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeacherId || !selectedSubjectId) {
      toast.error("Please select both teacher and subject");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/superadmin/teachers/assign",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teacherId: selectedTeacherId,
            sectionId,
            subjectId: selectedSubjectId,
            action: "assign",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to assign teacher");
        return;
      }

      toast.success("Teacher assigned successfully");
      setSelectedTeacherId("");
      setSelectedSubjectId("");
      onSuccess();
    } catch (error) {
      console.error("Error assigning teacher:", error);
      toast.error("Failed to assign teacher");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Assign Teacher to Section</h2>

        <form onSubmit={handleAssign} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Teacher *
            </label>
            {availableTeachers.length === 0 ? (
              <div className="p-3 text-center border border-gray-200 rounded-md bg-gray-50">
                <p className="text-sm text-gray-500">
                  No available teachers to assign
                </p>
              </div>
            ) : (
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">-- Select Teacher --</option>
                {availableTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Subject *
            </label>
            {subjects.length === 0 ? (
              <div className="p-3 text-center border border-gray-200 rounded-md bg-gray-50">
                <p className="text-sm text-gray-500">
                  No subjects available
                </p>
              </div>
            ) : (
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                disabled={loading}
              >
                <option value="">-- Select Subject --</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} {subject.code ? `(${subject.code})` : ""}
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
              disabled={loading || availableTeachers.length === 0 || subjects.length === 0}
            >
              {loading ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
