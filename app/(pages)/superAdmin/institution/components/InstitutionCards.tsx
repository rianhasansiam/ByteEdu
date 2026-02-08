"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { updateInstitutionStatus } from "@/lib/db/institutions";
import { getRoleBadgeColor } from "./types";

type Props = {
  hasActiveFilters: boolean;
}

export default function InstitutionCards({ hasActiveFilters }: Props) {
  const institutions = useAppSelector((s) => s.institutions.institutions);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  const toggleCard = (name: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleStatusToggle = async (
    e: React.MouseEvent,
    name: string,
    currentStatus: "active" | "inactive"
  ) => {
    e.stopPropagation();
    setTogglingStatus(name);
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await updateInstitutionStatus(name, newStatus);
      toast.success(`Institution ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update institution status");
    } finally {
      setTogglingStatus(null);
    }
  };

  if (institutions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-12 text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <p className="text-lg font-medium">No institutions found</p>
          {hasActiveFilters && (
            <p className="text-sm mt-1">Try adjusting your filters</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {institutions.map((inst) => {
        const isExpanded = expandedCards.has(inst.name);
        const isToggling = togglingStatus === inst.name;

        return (
          <div
            key={inst.name}
            className={`bg-white rounded-xl shadow-sm border transition-all ${
              inst.status === "active"
                ? "border-gray-100"
                : "border-red-100 bg-red-50/30"
            }`}
          >
            {/* Card Header */}
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                      inst.status === "active"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                      {inst.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Last joined:{" "}
                      {new Date(inst.latestJoin).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Status Toggle */}
                <button
                  onClick={(e) => handleStatusToggle(e, inst.name, inst.status)}
                  disabled={isToggling}
                  className="flex items-center gap-2 shrink-0"
                  title={`Click to ${
                    inst.status === "active" ? "deactivate" : "activate"
                  }`}
                >
                  <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isToggling
                        ? "opacity-50 cursor-wait"
                        : "cursor-pointer"
                    } ${
                      inst.status === "active" ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                        inst.status === "active"
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      inst.status === "active"
                        ? "text-green-700"
                        : "text-gray-500"
                    }`}
                  >
                    {inst.status === "active" ? "Active" : "Inactive"}
                  </span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-lg font-bold text-gray-900">
                    {inst.totalUsers}
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">
                    Total
                  </p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded-lg">
                  <p className="text-lg font-bold text-purple-600">
                    {inst.admins}
                  </p>
                  <p className="text-[10px] text-purple-500 uppercase tracking-wide">
                    Admins
                  </p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    {inst.teachers}
                  </p>
                  <p className="text-[10px] text-green-500 uppercase tracking-wide">
                    Teachers
                  </p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-lg font-bold text-blue-600">
                    {inst.students}
                  </p>
                  <p className="text-[10px] text-blue-500 uppercase tracking-wide">
                    Students
                  </p>
                </div>
              </div>

              {/* View Users Button */}
              <button
                onClick={() => toggleCard(inst.name)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isExpanded
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                {isExpanded
                  ? "Hide Users"
                  : `View ${inst.totalUsers} Users`}
                <svg
                  className={`w-4 h-4 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {/* Expanded Users List */}
            {isExpanded && (
              <div className="border-t border-gray-100">
                <div className="max-h-80 overflow-y-auto">
                  {inst.users.map((user, index) => (
                    <div
                      key={user.id}
                      className={`flex items-center justify-between px-5 py-3 hover:bg-gray-50 ${
                        index < inst.users.length - 1
                          ? "border-b border-gray-50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {user.picture ? (
                          <Image
                            src={user.picture}
                            alt={user.name}
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getRoleBadgeColor(
                            user.role
                          )}`}
                        >
                          {user.role.replace("_", " ")}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
