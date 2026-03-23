"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AttendanceForm, SectionSelector } from "../components/AttendanceForm";
import toast from "react-hot-toast";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

interface Section {
  id: string;
  name: string;
  className: string;
  classId: string;
  studentCount: number;
  isClassTeacher: boolean;
}

interface AttendanceStudent {
  studentId: string;
  name: string;
  roll: string | null;
  status: AttendanceStatus | null;
  remarks: string | null;
}

export default function AttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loadingSections, setLoadingSections] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<AttendanceStudent[]>([]);
  const [attendanceExists, setAttendanceExists] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch sections
  useEffect(() => {
    const fetchSections = async () => {
      setLoadingSections(true);
      try {
        const res = await fetch("/api/teacher/sections");
        if (res.ok) {
          const data = await res.json();
          setSections(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching sections:", error);
        toast.error("Failed to load sections");
      } finally {
        setLoadingSections(false);
      }
    };

    if (status === "authenticated") {
      fetchSections();
    }
  }, [status]);

  // Fetch attendance for selected section and date
  const fetchAttendance = useCallback(async (sectionId: string, date: string) => {
    setLoadingAttendance(true);
    try {
      const params = new URLSearchParams({
        sectionId,
        date,
      });
      const res = await fetch(`/api/teacher/attendance?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch attendance");
      }

      const data = await res.json();
      setStudents(data.data.students || []);
      setAttendanceExists(data.data.attendanceExists);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  // Handle section selection
  const handleSectionSelect = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    const section = sections.find((s) => s.id === sectionId);
    setSelectedSection(section || null);
    fetchAttendance(sectionId, selectedDate);
  };

  // Handle date change
  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (selectedSectionId) {
      fetchAttendance(selectedSectionId, date);
    }
  };

  // Handle attendance submission
  const handleSubmitAttendance = async (
    records: Array<{ studentId: string; status: AttendanceStatus; remarks?: string }>
  ) => {
    if (!selectedSectionId) return;

    const res = await fetch("/api/teacher/attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sectionId: selectedSectionId,
        date: selectedDate,
        records,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to submit attendance");
    }

    // Refresh attendance data
    await fetchAttendance(selectedSectionId, selectedDate);
  };

  if (status === "loading" || loadingSections) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Take Attendance</h1>
        <p className="text-gray-500 mt-1">
          Mark attendance for your assigned sections
        </p>
      </div>

      {/* Section Selector */}
      <div className="mb-6">
        <SectionSelector
          sections={sections}
          selectedSectionId={selectedSectionId}
          onSelect={handleSectionSelect}
          loading={loadingSections}
        />
      </div>

      {/* Attendance Form */}
      {selectedSectionId && selectedSection && (
        <>
          {loadingAttendance ? (
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          ) : (
            <AttendanceForm
              sectionId={selectedSectionId}
              sectionName={selectedSection.name}
              className={selectedSection.className}
              date={selectedDate}
              students={students}
              attendanceExists={attendanceExists}
              onSubmit={handleSubmitAttendance}
              onDateChange={handleDateChange}
            />
          )}
        </>
      )}

      {/* Empty State */}
      {!selectedSectionId && sections.length > 0 && (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-800">Select a Section</h3>
          <p className="mt-1 text-gray-500">
            Choose a section above to start taking attendance
          </p>
        </div>
      )}
    </div>
  );
}
