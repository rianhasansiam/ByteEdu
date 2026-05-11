"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FullUserData } from "./types";

type Role = "USER" | "ADMIN" | "TEACHER" | "STUDENT";

type ClassData = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type Props = {
  user: FullUserData;
  onClose: () => void;
  onSaved: () => void;
};

export default function AdminEditUserModal({ user, onClose, onSaved }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [classes, setClasses] = useState<ClassData[]>([]);

  // Form state
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role as Role,
    sectionId: user.sectionId || "",
    roll: user.roll || "",
    classTeacherSectionId: user.classTeacherOf?.[0]?.id || "",
  });

  // Fetch classes for this institution
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/admin/classes");
        if (res.ok) {
          const data = await res.json();
          setClasses(data.classes || []);
        }
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const allSections = classes.flatMap((cls) =>
    cls.sections.map((sec) => ({
      id: sec.id,
      name: `${cls.name} - ${sec.name}`,
      classId: cls.id,
      className: cls.name,
      sectionName: sec.name,
    }))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (form.role === "STUDENT" && !form.sectionId) {
      toast.error("Please select a class and section for the student");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          sectionId: form.role === "STUDENT" ? form.sectionId || null : null,
          roll: form.role === "STUDENT" ? form.roll.trim() || null : null,
          classTeacherSectionId: form.role === "TEACHER" ? form.classTeacherSectionId || null : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update user");
      }

      toast.success("User updated successfully");
      onSaved();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setForm((prev) => ({
      ...prev,
      role: newRole,
      sectionId: newRole === "STUDENT" ? prev.sectionId : "",
      roll: newRole === "STUDENT" ? prev.roll : "",
      classTeacherSectionId: newRole === "TEACHER" ? prev.classTeacherSectionId : "",
    }));
  };

  const getRoleBtnColor = (role: Role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "TEACHER":
        return "bg-green-100 text-green-800 border-green-200";
      case "STUDENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-500 mt-1">
              Editing: {user.name} ({user.email})
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Basic Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Email address"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Role Selection - No SUPER_ADMIN */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Role</h3>
              <div className="flex flex-wrap gap-2">
                {(["USER", "STUDENT", "TEACHER", "ADMIN"] as Role[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      form.role === role
                        ? "border-black bg-black text-white"
                        : `${getRoleBtnColor(role)} hover:border-gray-400`
                    }`}
                  >
                    {role.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Teacher-specific */}
            {form.role === "TEACHER" && (
              <div className="bg-green-50 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900">Teacher Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Teacher Of (Optional)
                  </label>
                  <select
                    value={form.classTeacherSectionId}
                    onChange={(e) => setForm((prev) => ({ ...prev, classTeacherSectionId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="">Not a class teacher</option>
                    {allSections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Assign this teacher as the class teacher of a section
                  </p>
                </div>

                {/* Current assignments (read-only display) */}
                {user.teacherAssignments && user.teacherAssignments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Assignments</label>
                    <div className="space-y-1">
                      {user.teacherAssignments.map((a) => (
                        <div key={a.id} className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded border border-gray-200">
                          {a.section.class.name} - {a.section.name}
                          {a.subject && <span className="text-gray-400 ml-1">({a.subject.name})</span>}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Use the Assign Teacher page to manage teaching assignments
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Student-specific */}
            {form.role === "STUDENT" && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900">Student Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class & Section <span className="text-red-500">*</span>
                  </label>
                  {allSections.length === 0 ? (
                    <p className="text-sm text-amber-600 py-2">
                      No classes/sections available. Please create classes first.
                    </p>
                  ) : (
                    <select
                      value={form.sectionId}
                      onChange={(e) => setForm((prev) => ({ ...prev, sectionId: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    >
                      <option value="">Select Class & Section</option>
                      {classes.map((cls) => (
                        <optgroup key={cls.id} label={cls.name}>
                          {cls.sections.map((section) => (
                            <option key={section.id} value={section.id}>
                              {cls.name} - Section {section.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={form.roll}
                    onChange={(e) => setForm((prev) => ({ ...prev, roll: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., 101"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
