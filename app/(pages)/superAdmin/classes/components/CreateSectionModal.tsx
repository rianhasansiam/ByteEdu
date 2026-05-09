"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { TeacherOption } from "./types";

interface CreateSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  classId: string;
  className: string;
  institutionId: string;
  teachers: TeacherOption[];
}

export default function CreateSectionModal({
  isOpen,
  onClose,
  onSuccess,
  classId,
  className,
  institutionId,
  teachers,
}: CreateSectionModalProps) {
  const [name, setName] = useState("");
  const [classTeacherId, setClassTeacherId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a section name");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/superadmin/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId,
          name: name.trim(),
          classTeacherId: classTeacherId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create section");
      }

      toast.success("Section created successfully");
      setName("");
      setClassTeacherId("");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating section:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create section"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Create New Section
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          For <span className="font-semibold">{className}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., A, B, C"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Teacher (Optional)
            </label>
            <select
              value={classTeacherId}
              onChange={(e) => setClassTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select a teacher...</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name} ({teacher.email})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              You can assign a teacher later
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
