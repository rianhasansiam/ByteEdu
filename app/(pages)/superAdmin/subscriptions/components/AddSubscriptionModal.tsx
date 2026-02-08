"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { createSubscription } from "@/lib/db/subscriptions";
import { formatCurrency } from "./types";

export default function AddSubscriptionModal() {
  const plans = useAppSelector((s) => s.plans.plans);
  const institutions = useAppSelector((s) => s.subscriptions.availableInstitutions);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    institutionId: "",
    planId: "",
    amount: "",
    billingCycle: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    paymentStatus: "due",
    transactionId: "",
    notes: "",
  });

  // When plan changes, auto-fill amount and billing cycle
  const handlePlanChange = (planId: string) => {
    const selected = plans.find((p) => p.id === planId);
    if (selected) {
      const start = new Date(form.startDate);
      const end = new Date(start);
      if (selected.billingCycle === "yearly") {
        end.setFullYear(end.getFullYear() + 1);
      } else {
        end.setMonth(end.getMonth() + 1);
      }
      setForm({
        ...form,
        planId,
        amount: selected.price.toString(),
        billingCycle: selected.billingCycle,
        endDate: end.toISOString().split("T")[0],
      });
    } else {
      setForm({ ...form, planId });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.institutionId || !form.planId || !form.amount || !form.endDate) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSubscription({
        institutionId: form.institutionId,
        planId: form.planId,
        amount: parseFloat(form.amount),
        billingCycle: form.billingCycle,
        startDate: new Date(form.startDate),
        endDate: new Date(form.endDate),
        paymentStatus: form.paymentStatus,
        transactionId: form.transactionId || undefined,
        notes: form.notes || undefined,
      });
      setShowModal(false);
      setForm({
        institutionId: "",
        planId: "",
        amount: "",
        billingCycle: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: "",
        paymentStatus: "due",
        transactionId: "",
        notes: "",
      });
      toast.success("Subscription assigned successfully");
    } catch (error) {
      console.error("Failed to create subscription:", error);
      toast.error("Failed to create subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activePlans = plans.filter((p) => p.isActive);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        + Assign Subscription
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Assign Subscription
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Institution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution *
                </label>
                <select
                  value={form.institutionId}
                  onChange={(e) =>
                    setForm({ ...form, institutionId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  required
                >
                  <option value="">Select Institution</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Plan Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan *
                </label>
                {activePlans.length === 0 ? (
                  <p className="text-sm text-red-500 py-2">
                    No active plans available. Create a plan first.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {activePlans.map((p) => (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                          form.planId === p.id
                            ? "border-black ring-2 ring-black bg-gray-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="plan"
                            value={p.id}
                            checked={form.planId === p.id}
                            onChange={() => handlePlanChange(p.id)}
                            className="sr-only"
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {p.name}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                              {p.billingCycle}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(p.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Amount (auto-filled but editable) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (৳) *
                  </label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Auto-filled from plan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={form.paymentStatus}
                    onChange={(e) =>
                      setForm({ ...form, paymentStatus: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="due">Due</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction ID
                </label>
                <input
                  type="text"
                  value={form.transactionId}
                  onChange={(e) =>
                    setForm({ ...form, transactionId: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Optional"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>

              {/* Buttons */}
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
                  disabled={isSubmitting || activePlans.length === 0}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Assigning..." : "Assign Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
