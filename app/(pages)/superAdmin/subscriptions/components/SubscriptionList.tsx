"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/store/hooks";
import {
  updateSubscriptionStatus,
  deleteSubscription,
} from "@/lib/db/subscriptions";
import {
  getStatusBadge,
  getPlanBadge,
  formatCurrency,
} from "./types";

type Props = {
  hasActiveFilters: boolean;
}

export default function SubscriptionList({ hasActiveFilters }: Props) {
  const subscriptions = useAppSelector((s) => s.subscriptions.subscriptions);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleStatusChange = async (
    id: string,
    newStatus: "paid" | "due" | "overdue"
  ) => {
    setUpdatingId(id);
    try {
      await updateSubscriptionStatus(id, newStatus);
      toast.success(`Payment marked as ${newStatus}`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update payment status");
    } finally {
      setUpdatingId(null);
      setOpenMenuId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this subscription?")) return;
    try {
      await deleteSubscription(id);
      toast.success("Subscription deleted successfully");
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete subscription");
    }
    setOpenMenuId(null);
  };

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-lg font-medium text-gray-500">
          No subscriptions found
        </p>
        {hasActiveFilters && (
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your filters
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-h-[30vh]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Institution
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Plan
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Amount
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Cycle
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Period
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                  Payment
                </th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {subscriptions.map((sub) => {
                const isUpdating = updatingId === sub.id;
                const isMenuOpen = openMenuId === sub.id;
                const isExpired = new Date(sub.endDate) < new Date();
                const daysLeft = Math.ceil(
                  (new Date(sub.endDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24)
                );

                return (
                  <tr
                    key={sub.id}
                    className={`hover:bg-gray-50 ${
                      sub.paymentStatus === "overdue" ? "bg-red-50/40" : ""
                    }`}
                  >
                    {/* Institution */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sub.institution.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isExpired ? (
                            <span className="text-red-500">Expired</span>
                          ) : (
                            <span
                              className={
                                daysLeft <= 7
                                  ? "text-yellow-600"
                                  : ""
                              }
                            >
                              {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                            </span>
                          )}
                        </p>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPlanBadge(
                          sub.plan.name
                        )}`}
                      >
                        {sub.plan.name}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {formatCurrency(sub.amount)}
                    </td>

                    {/* Cycle */}
                    <td className="px-6 py-4 text-gray-600 capitalize text-sm">
                      {sub.billingCycle}
                    </td>

                    {/* Period */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">
                        <p>
                          {new Date(sub.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                          {" → "}
                          {new Date(sub.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        {sub.paidAt && (
                          <p className="text-xs text-green-600">
                            Paid{" "}
                            {new Date(sub.paidAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Payment Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          isUpdating ? "opacity-50" : ""
                        } ${getStatusBadge(sub.paymentStatus)}`}
                      >
                        {isUpdating ? "..." : sub.paymentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right relative   ">
                      <button
                        onClick={() =>
                          setOpenMenuId(isMenuOpen ? null : sub.id)
                        }
                        className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                      >
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
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      </button>
                      {isMenuOpen && (
                        <div className="absolute  right-6 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 w-40">
                          {sub.paymentStatus !== "paid" && (
                            <button
                              onClick={() =>
                                handleStatusChange(sub.id, "paid")
                              }
                              disabled={isUpdating}
                              className="w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-50 flex items-center gap-2"
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
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Mark Paid
                            </button>
                          )}
                          {sub.paymentStatus !== "due" && (
                            <button
                              onClick={() =>
                                handleStatusChange(sub.id, "due")
                              }
                              disabled={isUpdating}
                              className="w-full text-left px-4 py-2 text-sm text-yellow-700 hover:bg-yellow-50 flex items-center gap-2"
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
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Mark Due
                            </button>
                          )}
                          {sub.paymentStatus !== "overdue" && (
                            <button
                              onClick={() =>
                                handleStatusChange(sub.id, "overdue")
                              }
                              disabled={isUpdating}
                              className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center gap-2"
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
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              Mark Overdue
                            </button>
                          )}
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </>
  );
}
