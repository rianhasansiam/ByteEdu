"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";
import { ClassData, Student, Subject } from "./types";
import SectionsList from "./SectionsList";
import EditClassModal from "./EditClassModal";

interface ClassesListProps {
  classes: ClassData[];
  institutionId: string;
  teachers: any[];
  students?: Student[];
  subjects?: Subject[];
}

export default function ClassesList({
  classes,
  institutionId,
  teachers,
  students = [],
  subjects = [],
}: ClassesListProps) {
  const router = useRouter();
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleDelete = async (classId: string) => {
    if (!(await sweetConfirm("Are you sure you want to delete this class?"))) return;

    setDeletingId(classId);
    try {
      const response = await fetch(`/api/superadmin/classes/${classId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete class");
      }

      toast.success("Class deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete class"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <p className="text-gray-500 text-lg">No classes created yet</p>
        <p className="text-gray-400 text-sm mt-2">
          Create your first class to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {classes.map((cls) => (
        <div
          key={cls.id}
          className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden"
        >
          {/* Class Header */}
          <div
            className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
            onClick={() =>
              setExpandedClass(expandedClass === cls.id ? null : cls.id)
            }
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C6.224 6.253 2.5 10.19 2.5 15a9.5 9.5 0 1019 0c0-4.81-3.724-8.747-9.5-8.747z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                <p className="text-xs text-gray-500">
                  {cls.sections.length} section{cls.sections.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingClassId(cls.id);
                  setEditModalOpen(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(cls.id);
                }}
                disabled={deletingId === cls.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>

              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedClass === cls.id ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>

          {/* Sections */}
          {expandedClass === cls.id && (
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <SectionsList
                classId={cls.id}
                className={cls.name}
                sections={cls.sections}
                institutionId={institutionId}
                teachers={teachers}
                institutionStudents={students}
                subjects={subjects}
              />
            </div>
          )}
        </div>
      ))}

      <EditClassModal
        isOpen={editModalOpen}
        classData={
          editingClassId
            ? classes.find((c) => c.id === editingClassId) || null
            : null
        }
        onClose={() => {
          setEditModalOpen(false);
          setEditingClassId(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
