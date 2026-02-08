"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { FilterState } from "./types";

type Props = {
  filters: FilterState;
  hasActiveFilters: boolean;
}

export default function UsersFiltersClient({ filters, hasActiveFilters }: Props) {
  const institutions = useAppSelector((s) => s.users.institutions);
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams]
  );

  const clearFilters = () => {
    router.push("?");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col gap-4">
        {/* First row - Search and Role */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                defaultValue={filters.searchTerm}
                onChange={(e) => updateSearchParams("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Role</label>
            <select
              value={filters.roleFilter}
              onChange={(e) => updateSearchParams("role", e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
              <option value="STUDENT">Student</option>
              <option value="USER">User</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Institution</label>
            <select
              value={filters.institutionFilter}
              onChange={(e) => updateSearchParams("institution", e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="ALL">All Institutions</option>
              <option value="NONE">No Institution</option>
              {institutions.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Second row - Date filters and Clear */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="w-full md:w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Created From</label>
            <input
              type="date"
              defaultValue={filters.dateFrom}
              onChange={(e) => updateSearchParams("dateFrom", e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">Created To</label>
            <input
              type="date"
              defaultValue={filters.dateTo}
              onChange={(e) => updateSearchParams("dateTo", e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
          <div className="flex-1"></div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
