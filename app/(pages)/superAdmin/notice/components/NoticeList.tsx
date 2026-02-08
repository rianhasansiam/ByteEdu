"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { deleteNotice, toggleNoticePublish } from "@/lib/db/notices";
import {
  getPriorityBadgeColor,
  getTargetLabel,
  getTargetBadgeColor,
} from "./types";

type Props = {
  hasActiveFilters: boolean;
};

export default function NoticeList({ hasActiveFilters }: Props) {
  const notices = useAppSelector((s) => s.notices.notices);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    setDeletingId(id);
    try {
      await deleteNotice(id);
      toast.success("Notice deleted successfully");
    } catch (error) {
      console.error("Failed to delete notice:", error);
      toast.error("Failed to delete notice");
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePublish = async (id: string, currentlyPublished: boolean) => {
    setTogglingId(id);
    try {
      await toggleNoticePublish(id);
      toast.success(
        currentlyPublished ? "Notice unpublished" : "Notice published successfully"
      );
    } catch (error) {
      console.error("Failed to toggle publish:", error);
      toast.error("Failed to update notice status");
    } finally {
      setTogglingId(null);
    }
  };

  if (notices.length === 0) {
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="text-lg font-medium">
            {hasActiveFilters ? "No notices match your filters" : "No notices yet"}
          </p>
          <p className="text-sm mt-1">
            {hasActiveFilters
              ? "Try adjusting your filter criteria"
              : 'Click "Create Notice" to publish your first announcement'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Title + Badges */}
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {notice.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${getPriorityBadgeColor(
                      notice.priority
                    )}`}
                  >
                    {notice.priority}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTargetBadgeColor(
                      notice.targetType,
                      notice.targetRole
                    )}`}
                  >
                    {getTargetLabel(notice)}
                  </span>
                  {notice.isPublished ? (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Draft
                    </span>
                  )}
                </div>

                {/* Content preview */}
                <p className="text-gray-600 line-clamp-2 text-sm">
                  {notice.content}
                </p>

                {/* Meta */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                  <span>
                    Created:{" "}
                    {new Date(notice.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  {notice.publishedAt && (
                    <span>
                      Published:{" "}
                      {new Date(notice.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  {notice.targetType === "user" && notice.targetUser && (
                    <span className="text-cyan-600">
                      To: {notice.targetUser.email}
                    </span>
                  )}
                  {notice.targetType === "institution" && notice.targetInstitution && (
                    <span className="text-pink-600">
                      Institution: {notice.targetInstitution.name}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 ml-4 shrink-0">
                {/* Toggle publish */}
                <button
                  onClick={() =>
                    handleTogglePublish(notice.id, notice.isPublished)
                  }
                  disabled={togglingId === notice.id}
                  className={`p-2 rounded-lg transition-colors ${
                    notice.isPublished
                      ? "text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50"
                      : "text-green-500 hover:text-green-700 hover:bg-green-50"
                  } disabled:opacity-50`}
                  title={notice.isPublished ? "Unpublish" : "Publish"}
                >
                  {togglingId === notice.id ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : notice.isPublished ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(notice.id)}
                  disabled={deletingId === notice.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Delete"
                >
                  {deletingId === notice.id ? (
                    <svg
                      className="w-5 h-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
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
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
