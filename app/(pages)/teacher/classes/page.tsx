"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Section {
  id: string;
  name: string;
  className: string;
  classId: string;
  studentCount: number;
  isClassTeacher: boolean;
  subjects: Array<{ id: string; name: string }>;
}

interface ClassTeacherSection {
  id: string;
  name: string;
  className: string;
  classId: string;
  studentCount: number;
}

interface AssignedSection {
  id: string;
  name: string;
  className: string;
  classId: string;
  studentCount: number;
  subject: { id: string; name: string };
}

export default function TeacherClassesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [classTeacherSections, setClassTeacherSections] = useState<ClassTeacherSection[]>([]);
  const [assignedSections, setAssignedSections] = useState<AssignedSection[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classTeacherRes, assignedRes] = await Promise.all([
          fetch("/api/teacher/sections?type=class-teacher"),
          fetch("/api/teacher/sections?type=assigned"),
        ]);

        if (!classTeacherRes.ok || !assignedRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const classTeacherData = await classTeacherRes.json();
        const assignedData = await assignedRes.json();

        setClassTeacherSections(classTeacherData.data || []);
        setAssignedSections(assignedData.data || []);
      } catch (error) {
        console.error("Error fetching classes:", error);
        toast.error("Failed to load class data");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchData();
    }
  }, [status]);

  // Group assigned sections by class
  const groupedAssignments = assignedSections.reduce((acc, section) => {
    const key = `${section.className} - ${section.name}`;
    if (!acc[key]) {
      acc[key] = {
        id: section.id,
        className: section.className,
        sectionName: section.name,
        classId: section.classId,
        studentCount: section.studentCount,
        subjects: [],
      };
    }
    acc[key].subjects.push(section.subject);
    return acc;
  }, {} as Record<string, { id: string; className: string; sectionName: string; classId: string; studentCount: number; subjects: Array<{ id: string; name: string }> }>);

  if (status === "loading" || loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-xl"></div>
            <div className="h-64 bg-gray-200 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
        <p className="text-gray-600 mt-1">
          View your class teacher assignments and teaching sections
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Class Teacher Of</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {classTeacherSections.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">section(s)</p>
            </div>
            <div className="bg-amber-500 text-white p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Teaching Sections</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Object.keys(groupedAssignments).length}
              </p>
              <p className="text-xs text-gray-400 mt-1">section(s)</p>
            </div>
            <div className="bg-blue-500 text-white p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Subjects</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {new Set(assignedSections.map((s) => s.subject.id)).size}
              </p>
              <p className="text-xs text-gray-400 mt-1">subject(s)</p>
            </div>
            <div className="bg-purple-500 text-white p-3 rounded-lg">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Teacher Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 text-amber-600 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Class Teacher Of</h2>
              <p className="text-sm text-gray-500">Sections where you are the class teacher</p>
            </div>
          </div>

          {classTeacherSections.length > 0 ? (
            <div className="space-y-3">
              {classTeacherSections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-4 bg-amber-50 border border-amber-100 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/teacher/students?sectionId=${section.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {section.className} - {section.name}
                    </p>
                    <p className="text-sm text-amber-700">Class Teacher</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{section.studentCount}</p>
                      <p className="text-xs text-gray-500">students</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="text-gray-500">You are not assigned as a class teacher</p>
              <p className="text-sm text-gray-400 mt-1">Contact admin for assignments</p>
            </div>
          )}
        </div>

        {/* Teaching Sections */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Teaching Sections</h2>
              <p className="text-sm text-gray-500">Sections and subjects you teach</p>
            </div>
          </div>

          {Object.keys(groupedAssignments).length > 0 ? (
            <div className="space-y-3">
              {Object.values(groupedAssignments).map((section) => (
                <div
                  key={section.id}
                  className="p-4 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  onClick={() => router.push(`/teacher/students?sectionId=${section.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {section.className} - {section.sectionName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{section.studentCount} students</span>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {section.subjects.map((subject) => (
                      <span
                        key={subject.id}
                        className="px-2 py-1 bg-white text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                      >
                        {subject.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-gray-500">No teaching assignments yet</p>
              <p className="text-sm text-gray-400 mt-1">Contact admin for subject assignments</p>
            </div>
          )}
        </div>
      </div>

      {/* All Subjects Summary */}
      {assignedSections.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Subjects You Teach</h2>
          <div className="flex flex-wrap gap-3">
            {Array.from(new Map(assignedSections.map((s) => [s.subject.id, s.subject])).values()).map((subject) => (
              <div
                key={subject.id}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="font-medium">{subject.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
