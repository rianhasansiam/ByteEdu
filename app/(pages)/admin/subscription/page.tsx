"use client";

import { useEffect, useState } from "react";

interface SubscriptionCurrent {
  id: string; planName: string; planPrice: number; features: string[];
  amount: number; billingCycle: string; paymentStatus: string;
  startDate: string; endDate: string; paidAt: string | null;
}

interface SubscriptionHistory {
  id: string; planName: string; amount: number; billingCycle: string;
  paymentStatus: string; startDate: string; endDate: string;
  paidAt: string | null; transactionId: string | null;
}

export default function AdminSubscriptionPage() {
  const [current, setCurrent] = useState<SubscriptionCurrent | null>(null);
  const [history, setHistory] = useState<SubscriptionHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/subscription");
        if (res.ok) {
          const data = await res.json();
          setCurrent(data.current);
          setHistory(data.history || []);
        }
      } catch (error) { console.error("Error:", error); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "due": return "bg-yellow-100 text-yellow-700";
      case "overdue": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const isExpired = current ? new Date(current.endDate) < new Date() : false;

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-xl"></div>
          <div className="h-32 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-600 mt-1">View your subscription plan and billing history</p>
      </div>

      {/* Current Plan */}
      {current ? (
        <div className={`rounded-xl shadow-sm border p-6 mb-8 ${isExpired ? "bg-red-50 border-red-200" : "bg-white"}`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Current Plan</h2>
              <p className="text-3xl font-bold text-gray-900 mt-2">{current.planName}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(current.paymentStatus)}`}>
                {current.paymentStatus.toUpperCase()}
              </span>
              {isExpired && <p className="text-red-600 text-sm mt-1 font-medium">Expired</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Amount</p>
              <p className="text-lg font-semibold text-gray-900">৳{current.amount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Billing Cycle</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">{current.billingCycle}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Start Date</p>
              <p className="text-lg font-semibold text-gray-900">{new Date(current.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">End Date</p>
              <p className={`text-lg font-semibold ${isExpired ? "text-red-600" : "text-gray-900"}`}>
                {new Date(current.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {current.features.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Plan Features:</p>
              <div className="flex flex-wrap gap-2">
                {current.features.map((f, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">✓ {f}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center mb-8">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Subscription</h2>
          <p className="text-gray-500">Contact your administrator to set up a subscription plan.</p>
        </div>
      )}

      {/* Payment History */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
        </div>
        {history.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Plan</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Amount</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Cycle</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Period</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-900">Paid At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{h.planName}</td>
                  <td className="px-6 py-4 text-gray-700">৳{h.amount}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{h.billingCycle}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {new Date(h.startDate).toLocaleDateString()} — {new Date(h.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(h.paymentStatus)}`}>{h.paymentStatus}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{h.paidAt ? new Date(h.paidAt).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-gray-500"><p>No payment history</p></div>
        )}
      </div>
    </div>
  );
}
