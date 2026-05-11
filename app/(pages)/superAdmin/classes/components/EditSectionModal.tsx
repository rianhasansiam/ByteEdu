"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Section, Teacher } from "./types";

interface EditSectionModalProps {
  isOpen: boolean;
  sectionData: Section | null;
  teachers: Teacher[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditSectionModal({
  isOpen,
  sectionData,
  teachers,
  onClose,
  onSuccess,
}: EditSectionModalProps) {
  const [name, setName] = useState("");
  const [classTeacherId, setClassTeacherId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sectionData && isOpen) {
      setName(sectionData.name);
      setClassTeacherId(sectionData.classTeacher?.id || "");
    }
  }, [sectionData, isOpen]);

  const handleClose = () => {
    setName("");
    setClassTeacherId("");
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a section name");
      return;
    }

    if (!sectionData) {
      toast.error("No section selected");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/superadmin/sections/${sectionData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          classTeacherId: classTeacherId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update section");
        return;
      }

      toast.success("Section updated successfully");
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error updating section:", error);
      toast.error("Failed to update section");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Section</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Section A"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class Teacher (Optional)
            </label>
            <select
              value={classTeacherId}
              onChange={(e) => setClassTeacherId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={loading}
            >
              <option value="">-- Select Teacher --</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              The main teacher responsible for this section.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 font-medium"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Section"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
