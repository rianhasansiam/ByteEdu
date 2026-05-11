"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { StudentTable, Pagination, StudentDetailModal, Student } from "../components/StudentTable";
import toast from "react-hot-toast";

interface StudentWithAttendance extends Student {
  studentAttendances?: Array<{
    id: string;
    date: Date | string;
    status: string;
    remarks: string | null;
  }>;
}

interface Section {
  id: string;
  name: string;
  className: string;
  studentCount: number;
  isClassTeacher: boolean;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function StudentsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSectionId = searchParams.get("sectionId") || "";

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState(initialSectionId);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentWithAttendance | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Fetch sections on mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await fetch("/api/teacher/sections");
        if (res.ok) {
          const data = await res.json();
          setSections(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    };

    if (status === "authenticated") {
      fetchSections();
    }
  }, [status]);

  // Fetch students
  const fetchStudents = useCallback(async (page: number = 1, sectionId?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (sectionId) {
        params.append("sectionId", sectionId);
      }

      const res = await fetch(`/api/teacher/students?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch students");
      }

      const data = await res.json();
      setStudents(data.data || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch students when section changes or on mount
  useEffect(() => {
    if (status === "authenticated") {
      fetchStudents(1, selectedSectionId || undefined);
    }
  }, [status, selectedSectionId, fetchStudents]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchStudents(page, selectedSectionId || undefined);
  };

  // Handle section change
  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    // Update URL without navigation
    const params = new URLSearchParams(searchParams.toString());
    if (sectionId) {
      params.set("sectionId", sectionId);
    } else {
      params.delete("sectionId");
    }
    router.replace(`/teacher/students?${params.toString()}`);
  };

  // Handle student click
  const handleStudentClick = async (student: Student) => {
    setLoadingStudent(true);
    try {
      const res = await fetch(`/api/teacher/students?studentId=${student.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedStudent(data.data);
      } else {
        toast.error("Failed to load student details");
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error("Failed to load student details");
    } finally {
      setLoadingStudent(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Students</h1>
        <p className="text-gray-500 mt-1">View and manage students in your sections</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.className} - {section.name}
                  {section.isClassTeacher ? " (Class Teacher)" : ""}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>
              Total: <strong className="text-gray-800">{pagination.total}</strong> students
            </span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <StudentTable
        students={students}
        onStudentClick={handleStudentClick}
        showSection={!selectedSectionId}
        loading={loading}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}

      {/* Loading overlay for student details */}
      {loadingStudent && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-xl">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading student details...</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    }>
      <StudentsContent />
    </Suspense>
  );
}
