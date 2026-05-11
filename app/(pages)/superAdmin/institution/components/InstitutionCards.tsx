"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { useAppSelector } from "@/lib/store/hooks";
import { getRoleBadgeColor } from "./types";

type Props = {
  hasActiveFilters: boolean;
};

export default function InstitutionCards({ hasActiveFilters }: Props) {
  const institutions = useAppSelector((s) => s.institutions.institutions);
  const router = useRouter();

  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStatusToggle = async (
    e: React.MouseEvent,
    institutionId: string,
    currentStatus: "active" | "inactive"
  ) => {
    e.stopPropagation();
    setTogglingStatus(institutionId);
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      const response = await fetch(`/api/superadmin/institutions/${institutionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast.success(`Institution ${newStatus === "active" ? "activated" : "deactivated"} successfully`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update institution status");
    } finally {
      setTogglingStatus(null);
    }
  };

  const startEdit = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(name);
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) { toast.error("Name cannot be empty"); return; }
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/superadmin/institutions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update");
      }
      toast.success("Institution name updated");
      setEditingId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/superadmin/institutions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete");
      }
      toast.success("Institution deleted");
      setConfirmDeleteId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Name", "Status", "Total Users", "Admins", "Teachers", "Students"],
      ...institutions.map((i) => [
        i.name, i.status, i.totalUsers, i.admins, i.teachers, i.students,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `institutions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  if (institutions.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-12 text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-lg font-medium">No institutions found</p>
          {hasActiveFilters && <p className="text-sm mt-1">Try adjusting your filters</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Delete confirm modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Institution</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              This will permanently delete <strong>{institutions.find((i) => i.id === confirmDeleteId)?.name}</strong> and all its associated data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDeleteId)} disabled={!!deletingId}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                {deletingId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export bar */}
      <div className="flex justify-end mb-4">
        <button onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV ({institutions.length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {institutions.map((inst) => {
          const isExpanded = expandedCards.has(inst.id);
          const isToggling = togglingStatus === inst.id;
          const isEditing = editingId === inst.id;

          return (
            <div key={inst.id}
              className={`bg-white rounded-xl shadow-sm border transition-all ${
                inst.status === "active" ? "border-gray-100" : "border-red-100 bg-red-50/30"
              }`}>
              {/* Card Header */}
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${
                      inst.status === "active" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-400"
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleEdit(inst.id); if (e.key === "Escape") setEditingId(null); }}
                            className="flex-1 border border-blue-300 rounded-lg px-2 py-1 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleEdit(inst.id)} disabled={savingEdit}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs disabled:opacity-50">
                            {savingEdit ? "…" : "Save"}
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-2 py-1 text-gray-500 text-xs">✕</button>
                        </div>
                      ) : (
                        <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate">{inst.name}</h3>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        Last joined: {new Date(inst.latestJoin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <button onClick={(e) => handleStatusToggle(e, inst.id, inst.status)} disabled={isToggling}
                    className="flex items-center gap-2 shrink-0 ml-2"
                    title={`Click to ${inst.status === "active" ? "deactivate" : "activate"}`}>
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isToggling ? "opacity-50 cursor-wait" : "cursor-pointer"
                    } ${inst.status === "active" ? "bg-green-500" : "bg-gray-300"}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm ${
                        inst.status === "active" ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </div>
                    <span className={`text-xs font-medium ${inst.status === "active" ? "text-green-700" : "text-gray-500"}`}>
                      {inst.status === "active" ? "Active" : "Inactive"}
                    </span>
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{inst.totalUsers}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">{inst.admins}</p>
                    <p className="text-[10px] text-purple-500 uppercase tracking-wide">Admins</p>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{inst.teachers}</p>
                    <p className="text-[10px] text-green-500 uppercase tracking-wide">Teachers</p>
                  </div>
                  <div className="text-center p-2 bg-blue-50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{inst.students}</p>
                    <p className="text-[10px] text-blue-500 uppercase tracking-wide">Students</p>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex gap-2 mb-3">
                  <button onClick={(e) => startEdit(e, inst.id, inst.name)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-100">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Name
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(inst.id); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-gray-100">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>

                {/* View Users Button */}
                <button onClick={() => toggleCard(inst.id)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isExpanded ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {isExpanded ? "Hide Users" : `View ${inst.totalUsers} Users`}
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Expanded Users List */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  <div className="max-h-80 overflow-y-auto">
                    {inst.users.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm py-6">No users in this institution</p>
                    ) : inst.users.map((user, index) => (
                      <div key={user.id}
                        className={`flex items-center justify-between px-5 py-3 hover:bg-gray-50 ${
                          index < inst.users.length - 1 ? "border-b border-gray-50" : ""
                        }`}>
                        <div className="flex items-center gap-3">
                          {user.picture ? (
                            <Image src={user.picture} alt={user.name} width={32} height={32}
                              className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${getRoleBadgeColor(user.role)}`}>
                            {user.role.replace("_", " ")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
    </>
  );
}
