"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, UserStats, FilterState } from "./components/types";
import AdminUserStatsCards from "./components/UserStatsCards";
import AdminUsersFilters from "./components/UsersFilters";
import AdminUsersTable from "./components/UsersTable";
import { exportToCsv } from "@/lib/exportCsv";

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({ total: 0, admins: 0, teachers: 0, students: 0, users: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    roleFilter: "ALL",
    dateFrom: "",
    dateTo: "",
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.roleFilter !== "ALL") params.set("role", filters.roleFilter);
      if (filters.searchTerm) params.set("search", filters.searchTerm);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "search") {
      // Debounce search
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        setFilters((prev) => ({ ...prev, searchTerm: value }));
      }, 300);
      return;
    }
    if (key === "role") {
      setFilters((prev) => ({ ...prev, roleFilter: value }));
    }
    if (key === "dateFrom") {
      setFilters((prev) => ({ ...prev, dateFrom: value }));
    }
    if (key === "dateTo") {
      setFilters((prev) => ({ ...prev, dateTo: value }));
    }
  };

  const handleRoleClick = (role: string) => {
    setFilters((prev) => ({
      ...prev,
      roleFilter: prev.roleFilter === role ? "ALL" : role,
    }));
  };

  const clearFilters = () => {
    setFilters({ searchTerm: "", roleFilter: "ALL", dateFrom: "", dateTo: "" });
  };

  const hasActiveFilters =
    filters.searchTerm ||
    filters.roleFilter !== "ALL" ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">
            Manage users in your institution ({users.length} of {stats.total} shown)
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => exportToCsv(users, "users", [
              { key: "name", label: "Name" },
              { key: "email", label: "Email" },
              { key: "phone", label: "Phone" },
              { key: "role", label: "Role" },
              { key: "createdAt", label: "Joined" },
            ])}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
            disabled={users.length === 0}
          >
            ↓ Export CSV
          </button>
          <Link
            href="/teacherSignup"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Add Teacher
          </Link>
          <Link
            href="/studentSignup"
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Add Student
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminUserStatsCards stats={stats} activeRole={filters.roleFilter} onRoleClick={handleRoleClick} />

      {/* Filters */}
      <AdminUsersFilters
        filters={filters}
        hasActiveFilters={!!hasActiveFilters}
        onFilterChange={handleFilterChange}
        onClear={clearFilters}
      />

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : (
        <AdminUsersTable users={users} hasActiveFilters={!!hasActiveFilters} onRefresh={fetchUsers} />
      )}
    </div>
  );
}
