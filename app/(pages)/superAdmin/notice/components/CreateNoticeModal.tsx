"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { createNotice, searchUsers, searchInstitutions } from "@/lib/db/notices";
import { Role } from "@/app/generated/prisma/client";

type UserResult = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

type InstitutionResult = {
  id: string;
  name: string;
  status: string;
};

export default function CreateNoticeModal() {
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    priority: "normal",
    targetType: "all", // all | role | user | institution
    targetRole: "" as string,
    targetUserId: "",
    targetInstitutionId: "",
  });

  // User search state
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Institution search state
  const [instQuery, setInstQuery] = useState("");
  const [instResults, setInstResults] = useState<InstitutionResult[]>([]);
  const [selectedInst, setSelectedInst] = useState<InstitutionResult | null>(null);
  const [showInstDropdown, setShowInstDropdown] = useState(false);
  const [isInstSearching, setIsInstSearching] = useState(false);
  const instDropdownRef = useRef<HTMLDivElement>(null);

  // Debounced user search
  useEffect(() => {
    if (form.targetType !== "user" || userQuery.length < 2) {
      setUserResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsers(userQuery);
        setUserResults(results);
        setShowDropdown(true);
      } catch {
        setUserResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userQuery, form.targetType]);

  // Debounced institution search
  useEffect(() => {
    if (form.targetType !== "institution" || instQuery.length < 2) {
      setInstResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsInstSearching(true);
      try {
        const results = await searchInstitutions(instQuery);
        setInstResults(results);
        setShowInstDropdown(true);
      } catch {
        setInstResults([]);
      } finally {
        setIsInstSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [instQuery, form.targetType]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (
        instDropdownRef.current &&
        !instDropdownRef.current.contains(e.target as Node)
      ) {
        setShowInstDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      priority: "normal",
      targetType: "all",
      targetRole: "",
      targetUserId: "",
      targetInstitutionId: "",
    });
    setUserQuery("");
    setSelectedUser(null);
    setUserResults([]);
    setInstQuery("");
    setSelectedInst(null);
    setInstResults([]);
  };

  const handleSubmit = async (publish: boolean) => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }

    if (form.targetType === "role" && !form.targetRole) {
      toast.error("Please select a target role");
      return;
    }

    if (form.targetType === "user" && !form.targetUserId) {
      toast.error("Please select a target user");
      return;
    }

    if (form.targetType === "institution" && !form.targetInstitutionId) {
      toast.error("Please select a target institution");
      return;
    }

    setIsSubmitting(true);
    try {
      await createNotice({
        title: form.title.trim(),
        content: form.content.trim(),
        priority: form.priority,
        targetType: form.targetType,
        targetRole:
          form.targetType === "role" ? (form.targetRole as Role) : undefined,
        targetUserId:
          form.targetType === "user" ? form.targetUserId : undefined,
        targetInstitutionId:
          form.targetType === "institution" ? form.targetInstitutionId : undefined,
        isPublished: publish,
      });

      setShowModal(false);
      resetForm();
      toast.success(
        publish ? "Notice published successfully" : "Notice saved as draft"
      );
    } catch (error) {
      console.error("Failed to create notice:", error);
      toast.error("Failed to create notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectUser = (user: UserResult) => {
    setSelectedUser(user);
    setForm((prev) => ({ ...prev, targetUserId: user.id }));
    setUserQuery(user.name);
    setShowDropdown(false);
  };

  const getRoleBadge = (role: Role) => {
    const colors: Record<string, string> = {
      ADMIN: "bg-indigo-100 text-indigo-700",
      TEACHER: "bg-green-100 text-green-700",
      STUDENT: "bg-orange-100 text-orange-700",
      SUPER_ADMIN: "bg-red-100 text-red-700",
      USER: "bg-gray-100 text-gray-700",
    };
    return colors[role] || "bg-gray-100 text-gray-700";
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        + Create Notice
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Create Notice
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
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

            {/* Form */}
            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Notice title"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.content}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, content: e.target.value }))
                  }
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Write your announcement..."
                  rows={5}
                />
              </div>

              {/* Priority + Target Type row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={form.targetType}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        targetType: val,
                        targetRole: "",
                        targetUserId: "",
                        targetInstitutionId: "",
                      }));
                      setSelectedUser(null);
                      setUserQuery("");
                      setSelectedInst(null);
                      setInstQuery("");
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="all">All Users</option>
                    <option value="role">By Role</option>
                    <option value="institution">Institution</option>
                    <option value="user">Specific User</option>
                  </select>
                </div>
              </div>

              {/* Role selector (when targetType = role) */}
              {form.targetType === "role" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Role <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {(["ADMIN", "TEACHER", "STUDENT"] as Role[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, targetRole: role }))
                        }
                        className={`flex-1 px-4 py-2.5 rounded-lg border-2 text-sm font-medium transition-all ${
                          form.targetRole === role
                            ? "border-black bg-black text-white"
                            : "border-gray-200 text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {role.charAt(0) + role.slice(1).toLowerCase() + "s"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Institution search (when targetType = institution) */}
              {form.targetType === "institution" && (
                <div ref={instDropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Institution <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={instQuery}
                      onChange={(e) => {
                        setInstQuery(e.target.value);
                        setSelectedInst(null);
                        setForm((prev) => ({ ...prev, targetInstitutionId: "" }));
                      }}
                      onFocus={() => {
                        if (instResults.length > 0) setShowInstDropdown(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent pr-10"
                      placeholder="Type institution name (min 2 chars)"
                    />
                    {isInstSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="w-4 h-4 animate-spin text-gray-400"
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
                      </div>
                    )}
                  </div>

                  {/* Selected institution chip */}
                  {selectedInst && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-lg text-sm">
                      <span className="font-medium text-pink-900">
                        {selectedInst.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded-full ${
                          selectedInst.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {selectedInst.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInst(null);
                          setInstQuery("");
                          setForm((prev) => ({ ...prev, targetInstitutionId: "" }));
                        }}
                        className="text-pink-400 hover:text-pink-600 ml-1"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Search results dropdown */}
                  {showInstDropdown && instResults.length > 0 && !selectedInst && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {instResults.map((inst) => (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => {
                            setSelectedInst(inst);
                            setForm((prev) => ({ ...prev, targetInstitutionId: inst.id }));
                            setInstQuery(inst.name);
                            setShowInstDropdown(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                        >
                          <p className="text-sm font-medium text-gray-900">
                            {inst.name}
                          </p>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              inst.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {inst.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results */}
                  {showInstDropdown &&
                    instResults.length === 0 &&
                    instQuery.length >= 2 &&
                    !isInstSearching &&
                    !selectedInst && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                        No institutions found matching &quot;{instQuery}&quot;
                      </div>
                    )}
                </div>
              )}

              {/* User search (when targetType = user) */}
              {form.targetType === "user" && (
                <div ref={dropdownRef} className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search User <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={userQuery}
                      onChange={(e) => {
                        setUserQuery(e.target.value);
                        setSelectedUser(null);
                        setForm((prev) => ({ ...prev, targetUserId: "" }));
                      }}
                      onFocus={() => {
                        if (userResults.length > 0) setShowDropdown(true);
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent pr-10"
                      placeholder="Type name or email (min 2 chars)"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="w-4 h-4 animate-spin text-gray-400"
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
                      </div>
                    )}
                  </div>

                  {/* Selected user chip */}
                  {selectedUser && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-50 border border-cyan-200 rounded-lg text-sm">
                      <span className="font-medium text-cyan-900">
                        {selectedUser.name}
                      </span>
                      <span className="text-cyan-600">
                        {selectedUser.email}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-xs rounded-full ${getRoleBadge(
                          selectedUser.role
                        )}`}
                      >
                        {selectedUser.role}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUser(null);
                          setUserQuery("");
                          setForm((prev) => ({ ...prev, targetUserId: "" }));
                        }}
                        className="text-cyan-400 hover:text-cyan-600 ml-1"
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Search results dropdown */}
                  {showDropdown && userResults.length > 0 && !selectedUser && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {userResults.map((user) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => selectUser(user)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {user.email}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${getRoleBadge(
                              user.role
                            )}`}
                          >
                            {user.role}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No results message */}
                  {showDropdown &&
                    userResults.length === 0 &&
                    userQuery.length >= 2 &&
                    !isSearching &&
                    !selectedUser && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-sm text-gray-500">
                        No users found matching &quot;{userQuery}&quot;
                      </div>
                    )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save as Draft"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Publishing..." : "Publish"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
