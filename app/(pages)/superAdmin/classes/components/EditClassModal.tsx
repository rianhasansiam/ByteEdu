"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Class } from "./types";

interface EditClassModalProps {
  isOpen: boolean;
  classData: Class | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditClassModal({
  isOpen,
  classData,
  onClose,
  onSuccess,
}: EditClassModalProps) {
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classData && isOpen) {
      setName(classData.name);
      setDisplayOrder(classData.displayOrder || 0);
    }
  }, [classData, isOpen]);

  const handleClose = () => {
    setName("");
    setDisplayOrder(0);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a class name");
      return;
    }

    if (!classData) {
      toast.error("No class selected");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/superadmin/classes/${classData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          displayOrder,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update class");
        return;
      }

      toast.success("Class updated successfully");
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error updating class:", error);
      toast.error("Failed to update class");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Edit Class</h2>
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
              Class Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Class 10-A"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for sorting classes. Lower numbers appear first.
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
              {loading ? "Updating..." : "Update Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
