"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { exportToCsv } from "@/lib/exportCsv";

interface Section {
  id: string;
  name: string;
  className: string;
  studentCount: number;
  isClassTeacher: boolean;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
  remarks: string | null;
  student: {
    id: string;
    name: string;
    roll: string | null;
  };
  section: {
    id: string;
    name: string;
    className: string;
  };
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function AttendanceHistoryContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 0,
  });

  // Filters
  const [selectedSectionId, setSelectedSectionId] = useState(searchParams.get("sectionId") || "");
  const [startDate, setStartDate] = useState(
    searchParams.get("startDate") || 
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    searchParams.get("endDate") || 
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  // Fetch sections
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

  // Fetch attendance history
  const fetchHistory = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (selectedSectionId) params.append("sectionId", selectedSectionId);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/teacher/attendance/history?${params}`);
      if (!res.ok) {
        throw new Error("Failed to fetch attendance history");
      }

      const data = await res.json();
      let filteredRecords = data.data.records || [];

      // Client-side status filter
      if (statusFilter) {
        filteredRecords = filteredRecords.filter(
          (r: AttendanceRecord) => r.status === statusFilter
        );
      }

      setRecords(filteredRecords);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      toast.error("Failed to load attendance history");
    } finally {
      setLoading(false);
    }
  }, [selectedSectionId, startDate, endDate, statusFilter]);

  // Fetch on filter change
  useEffect(() => {
    if (status === "authenticated") {
      fetchHistory(1);
    }
  }, [status, fetchHistory]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchHistory(page);
  };

  // Update URL with filters
  const updateFilters = () => {
    const params = new URLSearchParams();
    if (selectedSectionId) params.set("sectionId", selectedSectionId);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    if (statusFilter) params.set("status", statusFilter);
    router.replace(`/teacher/attendance/history?${params.toString()}`);
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return "bg-emerald-100 text-emerald-700";
      case "ABSENT":
        return "bg-rose-100 text-rose-700";
      case "LATE":
        return "bg-amber-100 text-amber-700";
      case "EXCUSED":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Group records by date
  const groupedRecords = records.reduce((acc, record) => {
    if (!acc[record.date]) {
      acc[record.date] = [];
    }
    acc[record.date].push(record);
    return acc;
  }, {} as Record<string, AttendanceRecord[]>);

  // Calculate statistics
  const stats = {
    total: records.length,
    present: records.filter((r) => r.status === "PRESENT").length,
    absent: records.filter((r) => r.status === "ABSENT").length,
    late: records.filter((r) => r.status === "LATE").length,
    excused: records.filter((r) => r.status === "EXCUSED").length,
  };

  if (status === "loading") {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Attendance History</h1>
          <p className="text-gray-500 mt-1">View attendance records you have submitted</p>
        </div>
        <button
          onClick={() => {
            const flat = records.map(r => ({
              date: r.date,
              studentName: r.student.name,
              roll: r.student.roll || "",
              class: r.section.className,
              section: r.section.name,
              status: r.status,
              remarks: r.remarks || "",
            }));
            exportToCsv(flat, "attendance_history", [
              { key: "date", label: "Date" },
              { key: "studentName", label: "Student" },
              { key: "roll", label: "Roll" },
              { key: "class", label: "Class" },
              { key: "section", label: "Section" },
              { key: "status", label: "Status" },
              { key: "remarks", label: "Remarks" },
            ]);
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          disabled={records.length === 0}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Section Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.className} - {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">All Status</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
              <option value="EXCUSED">Excused</option>
            </select>
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <button
              onClick={updateFilters}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200 text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-sm text-gray-500">Total Records</p>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.present}</p>
          <p className="text-sm text-emerald-600">Present</p>
        </div>
        <div className="bg-rose-50 rounded-lg p-4 border border-rose-200 text-center">
          <p className="text-2xl font-bold text-rose-600">{stats.absent}</p>
          <p className="text-sm text-rose-600">Absent</p>
        </div>
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.late}</p>
          <p className="text-sm text-amber-600">Late</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.excused}</p>
          <p className="text-sm text-blue-600">Excused</p>
        </div>
      </div>

      {/* Records */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : records.length === 0 ? (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-800">No Records Found</h3>
          <p className="mt-1 text-gray-500">
            No attendance records match your filters
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRecords)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dateRecords]) => (
              <div key={date} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Date Header */}
                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-800">
                    {new Date(date).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <p className="text-sm text-gray-500">{dateRecords.length} records</p>
                </div>

                {/* Records Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Student
                        </th>
                        <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Roll
                        </th>
                        <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Section
                        </th>
                        <th className="text-center py-2 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="text-left py-2 px-4 text-xs font-semibold text-gray-500 uppercase">
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dateRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-800">
                              {record.student.name}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600">{record.student.roll || "-"}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-600">
                              {record.section.className} - {record.section.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                                record.status
                              )}`}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-gray-500 text-sm">
                              {record.remarks || "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-gray-200">
          <p className="text-sm text-gray-600">
            Showing page <span className="font-medium">{pagination.page}</span> of{" "}
            <span className="font-medium">{pagination.totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendanceHistoryPage() {
  return (
    <Suspense fallback={
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
          <div className="h-64 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    }>
      <AttendanceHistoryContent />
    </Suspense>
  );
}
