"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { sweetConfirm } from "@/lib/sweetConfirm";
import { useAppSelector } from "@/lib/store/hooks";
import { getRoleBadgeColor } from "./types";
import EditUserModal from "./EditUserModal";

type FullUserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "USER" | "ADMIN" | "SUPER_ADMIN" | "TEACHER" | "STUDENT";
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

function ActionMenu({ 
  userId, 
  onClose, 
  onEdit, 
  onDelete 
}: { 
  userId: string; 
  onClose: () => void; 
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="absolute right-6 top-12 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-36">
      <button 
        onClick={() => { onEdit(userId); onClose(); }}
        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit
      </button>
      <button
        onClick={() => { onDelete(userId); onClose(); }}
        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </button>
    </div>
  );
}

type Props = {
  hasActiveFilters: boolean;
}

export default function UsersTableClient({ hasActiveFilters }: Props) {
  const users = useAppSelector((s) => s.users.users);
  const router = useRouter();
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingUser, setEditingUser] = useState<FullUserData | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const handleEditUser = async (userId: string) => {
    setIsLoadingUser(true);
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user');
      }
      
      const data = await response.json();
      setEditingUser(data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch user details");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!(await sweetConfirm("Are you sure you want to delete this user?"))) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/superadmin/users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
      
      toast.success("User deleted successfully");
      router.refresh();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setShowActionMenu(null);
    }
  };

  const handleInstitutionClick = (institution: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("institution", institution);
    router.push(`?${params.toString()}`);
  };

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="font-medium">No users found</p>
          {hasActiveFilters && <p className="text-sm mt-1">Try adjusting your filters</p>}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">User</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Institution</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Created</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <Image
                          src={user.picture}
                          alt={user.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600">{user.phone || "-"}</p>
                  </td>
                  <td className="px-6 py-4">
                    {user.institution ? (
                      <span
                        className="text-gray-600 cursor-pointer hover:text-black"
                        onClick={() => handleInstitutionClick(user.institution!)}
                      >
                        {user.institution}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={() => setShowActionMenu(showActionMenu === user.id ? null : user.id)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                      disabled={isLoadingUser}
                    >
                      {isLoadingUser && showActionMenu === user.id ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                          />
                        </svg>
                      )}
                    </button>
                    {showActionMenu === user.id && (
                      <ActionMenu
                        userId={user.id}
                        onClose={() => setShowActionMenu(null)}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Click outside to close action menu */}
        {showActionMenu && <div className="fixed inset-0 z-0" onClick={() => setShowActionMenu(null)} />}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
        />
      )}
    </>
  );
}
