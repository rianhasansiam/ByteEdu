// Shared types for admin users components

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  role: string;
  picture: string | null;
  createdAt: string;
};

export type UserStats = {
  total: number;
  admins: number;
  teachers: number;
  students: number;
  users: number;
};

export type FilterState = {
  searchTerm: string;
  roleFilter: string;
  dateFrom: string;
  dateTo: string;
};

export type FullUserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "USER" | "ADMIN" | "TEACHER" | "STUDENT";
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
    subject?: { id: string; name: string };
  }[];
  classTeacherOf?: {
    id: string;
    name: string;
    class: { id: string; name: string };
  }[];
};

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "ADMIN":
      return "bg-purple-100 text-purple-800";
    case "TEACHER":
      return "bg-green-100 text-green-800";
    case "STUDENT":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
