"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Transaction {
  id: string;
  institutionName: string;
  planName: string;
  amount: number;
  billingCycle: string;
  paymentStatus: string;
  transactionId: string | null;
  startDate: string;
  endDate: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface Stats {
  totalRevenue: number;
  totalDue: number;
  totalTransactions: number;
  paidCount: number;
  dueCount: number;
  overdueCount: number;
}

export default function TransactionPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0, totalDue: 0, totalTransactions: 0,
    paidCount: 0, dueCount: 0, overdueCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [txnIdInput, setTxnIdInput] = useState("");
  const [showMarkModal, setShowMarkModal] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/superadmin/transactions?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleMarkPaid = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await fetch("/api/superadmin/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          paymentStatus: "paid",
          transactionId: txnIdInput || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Marked as paid!");
        setShowMarkModal(null);
        setTxnIdInput("");
        await fetchData();
      } else {
        toast.error("Failed to update");
      }
    } catch { toast.error("Network error"); }
    finally { setMarkingId(null); }
  };

  const handleMarkOverdue = async (id: string) => {
    try {
      const res = await fetch("/api/superadmin/transactions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paymentStatus: "overdue" }),
      });
      if (res.ok) {
        toast.success("Marked as overdue");
        await fetchData();
      }
    } catch { toast.error("Network error"); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-700";
      case "due": return "bg-yellow-100 text-yellow-700";
      case "overdue": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const exportCSV = () => {
    const headers = ["Institution", "Plan", "Amount", "Cycle", "Status", "Transaction ID", "Paid At", "Period"];
    const rows = transactions.map((t) => [
      t.institutionName, t.planName, t.amount,
      t.billingCycle, t.paymentStatus, t.transactionId || "-",
      t.paidAt ? new Date(t.paidAt).toLocaleDateString() : "-",
      `${new Date(t.startDate).toLocaleDateString()} - ${new Date(t.endDate).toLocaleDateString()}`,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported!");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">Track all subscription payments across institutions</p>
        </div>
        <button onClick={exportCSV} disabled={transactions.length === 0}
          className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Total Revenue</p>
          {loading ? <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-1"></div> : (
            <p className="text-2xl font-bold text-gray-900 mt-1">৳{stats.totalRevenue.toLocaleString()}</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Total Due</p>
          {loading ? <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-1"></div> : (
            <p className="text-2xl font-bold text-red-600 mt-1">৳{stats.totalDue.toLocaleString()}</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Paid</p>
          {loading ? <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-1"></div> : (
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.paidCount}</p>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-sm font-medium text-gray-500">Overdue</p>
          {loading ? <div className="h-8 w-20 bg-gray-200 animate-pulse rounded mt-1"></div> : (
            <p className="text-2xl font-bold text-orange-600 mt-1">{stats.overdueCount}</p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by institution, plan, or transaction ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent" />
            </div>
          </form>
          <div className="flex gap-2">
            {["all", "paid", "due", "overdue"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  statusFilter === s ? "bg-black text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}>
                {s === "all" ? "All" : s}
                {s === "paid" && !loading && ` (${stats.paidCount})`}
                {s === "due" && !loading && ` (${stats.dueCount})`}
                {s === "overdue" && !loading && ` (${stats.overdueCount})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 bg-gray-200 rounded"></div>)}
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-lg font-medium">No transactions found</p>
            <p className="text-sm mt-1">Transactions will appear here once institutions start subscribing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Institution</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Plan</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Amount</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Cycle</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Period</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">TXN ID</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Paid At</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{t.institutionName}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{t.planName}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">৳{t.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{t.billingCycle}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {new Date(t.startDate).toLocaleDateString()} — {new Date(t.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(t.paymentStatus)}`}>
                        {t.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm font-mono">
                      {t.transactionId || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {t.paidAt ? new Date(t.paidAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.paymentStatus !== "paid" ? (
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => { setShowMarkModal(t.id); setTxnIdInput(""); }}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200">
                            Mark Paid
                          </button>
                          {t.paymentStatus === "due" && (
                            <button onClick={() => handleMarkOverdue(t.id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">
                              Overdue
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-green-600 text-xs">✓ Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Paid Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark as Paid</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (optional)</label>
              <input type="text" value={txnIdInput} onChange={(e) => setTxnIdInput(e.target.value)}
                placeholder="e.g., TXN-2024-001 or bKash TxnID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-black" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowMarkModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleMarkPaid(showMarkModal)} disabled={markingId === showMarkModal}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                {markingId === showMarkModal ? "Saving..." : "Confirm Payment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
