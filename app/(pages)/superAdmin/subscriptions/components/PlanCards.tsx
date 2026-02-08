"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { createPlan, deletePlan, togglePlanStatus } from "@/lib/db/plans";
import { formatCurrency } from "./types";

export default function PlanCards() {
  const plans = useAppSelector((s) => s.plans.plans);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    billingCycle: "monthly",
    features: "",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price) return;

    setIsSubmitting(true);
    try {
      await createPlan({
        name: form.name,
        price: parseFloat(form.price),
        billingCycle: form.billingCycle,
        features: form.features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
      });
      setShowModal(false);
      setForm({ name: "", price: "", billingCycle: "monthly", features: "" });
      toast.success("Plan created successfully");
    } catch (error) {
      console.error("Failed to create plan:", error);
      toast.error("Failed to create plan. Name may already exist.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this plan? Plans with subscriptions cannot be deleted.")) return;
    setDeletingId(id);
    try {
      await deletePlan(id);
      toast.success("Plan deleted successfully");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete plan";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string) => {
    setTogglingId(id);
    try {
      const plan = plans.find((p) => p.id === id);
      await togglePlanStatus(id);
      toast.success(`Plan ${plan?.isActive ? "deactivated" : "activated"} successfully`);
    } catch {
      toast.error("Failed to toggle plan status");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <>
      {/* Plans Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {plans.length} plan{plans.length !== 1 ? "s" : ""} created
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          + Create Plan
        </button>
      </div>

      {/* Plans Grid */}
      {plans.length === 0 ? (
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
            No plans created yet
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first subscription plan
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-xl shadow-sm border relative transition-all ${
                plan.isActive
                  ? "border-gray-100"
                  : "border-gray-200 opacity-60"
              }`}
            >
              {!plan.isActive && (
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-gray-200 text-gray-600 text-[10px] font-medium rounded-full">
                  Inactive
                </div>
              )}

              <div className="p-6">
                {/* Plan Name & Price */}
                <div className="text-center mb-5">
                  <h3 className="text-xl font-bold text-gray-900">
                    {plan.name}
                  </h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-gray-500">/{plan.billingCycle === "yearly" ? "year" : "month"}</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((feature, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <svg
                        className="w-4 h-4 text-green-500 shrink-0"
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
                      {feature}
                    </li>
                  ))}
                  {plan.features.length === 0 && (
                    <li className="text-sm text-gray-400 text-center">
                      No features listed
                    </li>
                  )}
                </ul>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(plan.id)}
                    disabled={togglingId === plan.id}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-colors ${
                      plan.isActive
                        ? "border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                        : "border-green-200 text-green-700 hover:bg-green-50"
                    } disabled:opacity-50`}
                  >
                    {togglingId === plan.id
                      ? "..."
                      : plan.isActive
                      ? "Deactivate"
                      : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    disabled={deletingId === plan.id}
                    className="flex-1 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === plan.id ? "..." : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Create Plan
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="e.g., Basic, Professional"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price (৳) *
                  </label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="999"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={form.billingCycle}
                    onChange={(e) =>
                      setForm({ ...form, billingCycle: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  value={form.features}
                  onChange={(e) =>
                    setForm({ ...form, features: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder={"Up to 100 students\n5 teachers\nBasic reports"}
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
