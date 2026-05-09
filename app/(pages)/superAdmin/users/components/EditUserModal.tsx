"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type Role = "USER" | "ADMIN" | "SUPER_ADMIN" | "TEACHER" | "STUDENT";

type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  picture: string | null;
  institutionId: string | null;
  institution: { id: string; name: string } | null;
  sectionId: string | null;
  section: {
    id: string;
    name: string;
    class: { id: string; name: string };
  } | null;
  roll: string | null;
  teacherAssignments?: {
    id: string;
    sectionId: string;
    section: { id: string; name: string; class: { id: string; name: string } };
  }[];
  classTeacherOf?: {
    id: string;
    name: string;
    class: { id: string; name: string };
  }[];
};

type Institution = {
  id: string;
  name: string;
};

type ClassData = {
  id: string;
  name: string;
  sections: { id: string; name: string }[];
};

type Props = {
  user: UserData;
  onClose: () => void;
};

export default function EditUserModal({ user, onClose }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    institutionId: user.institutionId || "",
    // Student specific
    sectionId: user.sectionId || "",
    roll: user.roll || "",
    // Teacher specific
    classTeacherSectionId: user.classTeacherOf?.[0]?.id || "",
    teacherAssignments: user.teacherAssignments?.map(a => a.sectionId) || [],
  });

  // Data for dropdowns
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);

  // Fetch dropdown data
  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Fetch classes when institution changes
  useEffect(() => {
    if (form.institutionId) {
      fetchClasses(form.institutionId);
    } else {
      setClasses([]);
    }
  }, [form.institutionId]);

  const fetchDropdownData = async () => {
    try {
      const response = await fetch('/api/superadmin/institutions');
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions || []);
      }
    } catch (error) {
      console.error("Failed to fetch institutions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async (institutionId: string) => {
    try {
      const response = await fetch(`/api/classes?institutionId=${institutionId}`);
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      setClasses([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    // Role-specific validation
    if (form.role === "ADMIN" && !form.institutionId) {
      toast.error("Please select an institution for the admin");
      return;
    }

    if (form.role === "STUDENT" && !form.sectionId) {
      toast.error("Please select a class and section for the student");
      return;
    }

    if (form.role === "TEACHER" && !form.institutionId) {
      toast.error("Please select an institution for the teacher");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/superadmin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          institutionId: form.institutionId || null,
          // Student specific
          sectionId: form.role === "STUDENT" ? form.sectionId || null : null,
          roll: form.role === "STUDENT" ? form.roll.trim() || null : null,
          // Teacher specific
          classTeacherSectionId: form.role === "TEACHER" ? form.classTeacherSectionId || null : null,
          teacherAssignments: form.role === "TEACHER" ? form.teacherAssignments : [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      toast.success("User updated successfully");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setForm(prev => ({
      ...prev,
      role: newRole,
      // Reset role-specific fields when role changes
      sectionId: newRole === "STUDENT" ? prev.sectionId : "",
      roll: newRole === "STUDENT" ? prev.roll : "",
      classTeacherSectionId: newRole === "TEACHER" ? prev.classTeacherSectionId : "",
      teacherAssignments: newRole === "TEACHER" ? prev.teacherAssignments : [],
      // Keep institution for ADMIN, TEACHER, STUDENT
      institutionId: ["ADMIN", "TEACHER", "STUDENT"].includes(newRole) ? prev.institutionId : "",
    }));
  };

  // Get all sections from all classes
  const allSections = classes.flatMap(cls => 
    cls.sections.map(sec => ({
      id: sec.id,
      name: `${cls.name} - ${sec.name}`,
      classId: cls.id,
      className: cls.name,
      sectionName: sec.name,
    }))
  );

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case "SUPER_ADMIN": return "bg-red-100 text-red-800 border-red-200";
      case "ADMIN": return "bg-purple-100 text-purple-800 border-purple-200";
      case "TEACHER": return "bg-green-100 text-green-800 border-green-200";
      case "STUDENT": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
            <p className="text-sm text-gray-500 mt-1">
              Editing: {user.name} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
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
            {/* Basic Info Section */}
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
                    onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
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
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Email address"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">Role</h3>
              
              <div className="flex flex-wrap gap-2">
                {(["USER", "STUDENT", "TEACHER", "ADMIN", "SUPER_ADMIN"] as Role[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      form.role === role
                        ? "border-black bg-black text-white"
                        : `${getRoleBadgeColor(role)} hover:border-gray-400`
                    }`}
                  >
                    {role.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Institution Selection - For ADMIN, TEACHER, STUDENT */}
            {["ADMIN", "TEACHER", "STUDENT"].includes(form.role) && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                <h3 className="font-medium text-gray-900">
                  {form.role === "ADMIN" ? "Admin Settings" : 
                   form.role === "TEACHER" ? "Teacher Settings" : 
                   "Student Settings"}
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institution <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.institutionId}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      institutionId: e.target.value,
                      sectionId: "", // Reset section when institution changes
                      classTeacherSectionId: "",
                      teacherAssignments: [],
                    }))}
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

                {/* Teacher-specific fields */}
                {form.role === "TEACHER" && form.institutionId && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Teacher Of (Optional)
                      </label>
                      <select
                        value={form.classTeacherSectionId}
                        onChange={(e) => setForm(prev => ({ ...prev, classTeacherSectionId: e.target.value }))}
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned Sections (Teaching)
                      </label>
                      {allSections.length === 0 ? (
                        <p className="text-sm text-gray-500 py-2">
                          No classes/sections available for this institution
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                          {allSections.map((section) => (
                            <label
                              key={section.id}
                              className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={form.teacherAssignments.includes(section.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setForm(prev => ({
                                      ...prev,
                                      teacherAssignments: [...prev.teacherAssignments, section.id],
                                    }));
                                  } else {
                                    setForm(prev => ({
                                      ...prev,
                                      teacherAssignments: prev.teacherAssignments.filter(id => id !== section.id),
                                    }));
                                  }
                                }}
                                className="rounded border-gray-300 text-black focus:ring-black"
                              />
                              <span className="text-sm text-gray-700">{section.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Select sections where this teacher will teach
                      </p>
                    </div>
                  </>
                )}

                {/* Student-specific fields */}
                {form.role === "STUDENT" && form.institutionId && (
                  <>
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
                          onChange={(e) => setForm(prev => ({ ...prev, sectionId: e.target.value }))}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Roll Number
                      </label>
                      <input
                        type="text"
                        value={form.roll}
                        onChange={(e) => setForm(prev => ({ ...prev, roll: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="e.g., 101"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Super Admin Warning */}
            {form.role === "SUPER_ADMIN" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Super Admin Role</h4>
                    <p className="text-sm text-red-600 mt-1">
                      This user will have full system access including managing other users, institutions, and system settings.
                    </p>
                  </div>
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
