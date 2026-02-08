"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { useAppSelector } from "@/lib/store/hooks";
import { SubscriptionFilterState } from "./types";

type Props = {
  filters: SubscriptionFilterState;
  hasActiveFilters: boolean;
}

export default function SubscriptionFilters({ filters, hasActiveFilters }: Props) {
  const plans = useAppSelector((s) => s.plans.plans);
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "tracking");
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
    const params = new URLSearchParams();
    params.set("tab", "tracking");
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Search */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search Institution
          </label>
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
              placeholder="Search by institution name..."
              defaultValue={filters.searchTerm}
              onChange={(e) => updateSearchParams("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>
        </div>

        {/* Payment Status */}
        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Payment
          </label>
          <select
            value={filters.statusFilter}
            onChange={(e) => updateSearchParams("status", e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="ALL">All Status</option>
            <option value="paid">Paid</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        {/* Plan Filter */}
        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Plan
          </label>
          <select
            value={filters.planFilter}
            onChange={(e) => updateSearchParams("plan", e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="ALL">All Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Billing Cycle */}
        <div className="w-full md:w-40">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Cycle
          </label>
          <select
            value={filters.cycleFilter}
            onChange={(e) => updateSearchParams("cycle", e.target.value)}
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="ALL">All Cycles</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
