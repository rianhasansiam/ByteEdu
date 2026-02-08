import { Role } from "@/app/generated/prisma/client";

export type TargetUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type TargetInstitution = {
  id: string;
  name: string;
};

export type NoticeRecord = {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetType: string;
  targetRole: Role | null;
  targetUserId: string | null;
  targetUser: TargetUser | null;
  targetInstitutionId: string | null;
  targetInstitution: TargetInstitution | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NoticeStats = {
  total: number;
  published: number;
  draft: number;
  highPriority: number;
  urgent: number;
};

export type NoticeFilterState = {
  searchTerm: string;
  priorityFilter: string;
  targetFilter: string;
  statusFilter: string;
};

export const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-200 text-red-900";
    case "high":
      return "bg-red-100 text-red-800";
    case "normal":
      return "bg-blue-100 text-blue-800";
    case "low":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getTargetLabel = (notice: NoticeRecord) => {
  if (notice.targetType === "all") return "All Users";
  if (notice.targetType === "role" && notice.targetRole) {
    return notice.targetRole.charAt(0) + notice.targetRole.slice(1).toLowerCase() + "s";
  }
  if (notice.targetType === "user" && notice.targetUser) {
    return notice.targetUser.name;
  }
  if (notice.targetType === "institution" && notice.targetInstitution) {
    return notice.targetInstitution.name;
  }
  return "Unknown";
};

export const getTargetBadgeColor = (targetType: string, targetRole?: Role | null) => {
  if (targetType === "all") return "bg-purple-100 text-purple-800";
  if (targetType === "user") return "bg-cyan-100 text-cyan-800";
  if (targetType === "institution") return "bg-pink-100 text-pink-800";
  if (targetType === "role") {
    switch (targetRole) {
      case "ADMIN":
        return "bg-indigo-100 text-indigo-800";
      case "TEACHER":
        return "bg-green-100 text-green-800";
      case "STUDENT":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }
  return "bg-gray-100 text-gray-800";
};
