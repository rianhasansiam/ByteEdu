"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface CreateClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  institutionId: string;
  existingClasses: number;
}

export default function CreateClassModal({
  isOpen,
  onClose,
  onSuccess,
  institutionId,
  existingClasses,
}: CreateClassModalProps) {
  const [name, setName] = useState("");
  const [displayOrder, setDisplayOrder] = useState(existingClasses + 1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a class name");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/superadmin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionId,
          name: name.trim(),
          displayOrder: parseInt(displayOrder.toString()),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create class");
      }

      toast.success("Class created successfully");
      setName("");
      setDisplayOrder(existingClasses + 2);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating class:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create class"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-96">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Class</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Class 1, 10-A"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(parseInt(e.target.value))}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Used for sorting classes (lower numbers appear first)
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
              {loading ? "Creating..." : "Create Class"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
