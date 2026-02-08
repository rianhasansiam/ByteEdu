"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { NoticeFilterState } from "./types";

type Props = {
  filters: NoticeFilterState;
  hasActiveFilters: boolean;
};

export default function NoticeFilters({ filters, hasActiveFilters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "ALL" && value !== "") {
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
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="flex-1 min-w-50">
          <input
            type="text"
            placeholder="Search notices..."
            defaultValue={filters.searchTerm}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length === 0 || val.length >= 2) {
                updateFilter("search", val);
              }
            }}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
          />
        </div>

        {/* Priority Filter */}
        <select
          value={filters.priorityFilter}
          onChange={(e) => updateFilter("priority", e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
        >
          <option value="ALL">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>

        {/* Target Filter */}
        <select
          value={filters.targetFilter}
          onChange={(e) => updateFilter("target", e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
        >
          <option value="ALL">All Targets</option>
          <option value="all">Everyone</option>
          <option value="ADMIN">Admins</option>
          <option value="TEACHER">Teachers</option>
          <option value="STUDENT">Students</option>
          <option value="institution">Institution</option>
          <option value="user">Specific User</option>
        </select>

        {/* Status Filter */}
        <select
          value={filters.statusFilter}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
        >
          <option value="ALL">All Status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
