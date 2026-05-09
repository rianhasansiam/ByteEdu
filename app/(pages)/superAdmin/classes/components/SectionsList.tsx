"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SectionData, TeacherOption, Student, Subject } from "./types";
import CreateSectionModal from "./CreateSectionModal";
import EditSectionModal from "./EditSectionModal";
import StudentList from "./StudentList";
import AssignStudentModal from "./AssignStudentModal";
import TeacherList, { TeacherAssignment } from "./TeacherList";
import AssignTeacherModal from "./AssignTeacherModal";

interface SectionsListProps {
  classId: string;
  className: string;
  sections: SectionData[];
  institutionId: string;
  teachers: TeacherOption[];
  institutionStudents?: Student[];
  subjects?: Subject[];
}

export default function SectionsList({
  classId,
  className,
  sections,
  institutionId,
  teachers,
  institutionStudents = [],
  subjects = [],
}: SectionsListProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [managingStudentsFor, setManagedStudentsFor] = useState<string | null>(
    null
  );
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [managingTeachersFor, setManagedTeachersFor] = useState<string | null>(
    null
  );
  const [assignTeacherModalOpen, setAssignTeacherModalOpen] = useState(false);
  const [sectionStudents, setSectionStudents] = useState<{
    [key: string]: Student[];
  }>({});
  const [sectionTeachers, setSectionTeachers] = useState<{
    [key: string]: TeacherAssignment[];
  }>({});

  const handleDelete = async (sectionId: string) => {
    if (!window.confirm("Are you sure you want to delete this section?"))
      return;

    setDeletingId(sectionId);
    try {
      const response = await fetch(`/api/superadmin/sections/${sectionId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete section");
      }

      toast.success("Section deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete section"
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="p-4 text-center border border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">No sections added yet</p>
          </div>
        ) : (
          sections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Section Header */}
              <div
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() =>
                  setExpandedSection(
                    expandedSection === section.id ? null : section.id
                  )
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      Section {section.name}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded">
                      {section._count?.students || 0} student
                      {section._count?.students !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {section.classTeacher && (
                    <p className="text-xs text-gray-600 mt-1">
                      Teacher: {section.classTeacher.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSectionId(section.id);
                      setEditModalOpen(true);
                    }}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(section.id);
                    }}
                    disabled={deletingId === section.id}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>

                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedSection === section.id ? "rotate-180" : ""
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

              {/* Students and Teachers Section */}
              {expandedSection === section.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-3 space-y-4">
                  {/* Students */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Students
                      </h4>
                      <button
                        onClick={() => {
                          setManagedStudentsFor(section.id);
                          setAssignModalOpen(true);
                        }}
                        className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        + Add Student
                      </button>
                    </div>

                    <StudentList
                      sectionId={section.id}
                      students={sectionStudents[section.id] || []}
                      onStudentRemoved={() => {
                        router.refresh();
                      }}
                    />
                  </div>

                  {/* Teachers */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Teachers
                      </h4>
                      <button
                        onClick={() => {
                          setManagedTeachersFor(section.id);
                          setAssignTeacherModalOpen(true);
                        }}
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                      >
                        + Add Teacher
                      </button>
                    </div>

                    <TeacherList
                      sectionId={section.id}
                      assignments={sectionTeachers[section.id] || []}
                      onTeacherRemoved={() => {
                        router.refresh();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-3 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center justify-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Section
        </button>
      </div>

      <CreateSectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => window.location.reload()}
        classId={classId}
        className={className}
        institutionId={institutionId}
        teachers={teachers}
      />

      <EditSectionModal
        isOpen={editModalOpen}
        sectionData={
          editingSectionId
            ? sections.find((s) => s.id === editingSectionId) || null
            : null
        }
        teachers={teachers}
        onClose={() => {
          setEditModalOpen(false);
          setEditingSectionId(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <AssignStudentModal
        isOpen={assignModalOpen}
        sectionId={managingStudentsFor || ""}
        institutionStudents={institutionStudents}
        assignedStudentIds={
          new Set(sectionStudents[managingStudentsFor || ""]?.map((s) => s.id))
        }
        onClose={() => {
          setAssignModalOpen(false);
          setManagedStudentsFor(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />

      <AssignTeacherModal
        isOpen={assignTeacherModalOpen}
        sectionId={managingTeachersFor || ""}
        teachers={teachers}
        subjects={subjects}
        assignedTeacherIds={
          new Set(
            sectionTeachers[managingTeachersFor || ""]?.map((a) => a.teacher.id)
          )
        }
        onClose={() => {
          setAssignTeacherModalOpen(false);
          setManagedTeachersFor(null);
        }}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </>
  );
}
