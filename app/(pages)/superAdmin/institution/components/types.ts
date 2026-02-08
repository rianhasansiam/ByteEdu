// Shared types for institution components

export type InstitutionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  role: string;
  picture: string | null;
  createdAt: Date;
}

export type InstitutionData = {
  name: string;
  totalUsers: number;
  admins: number;
  teachers: number;
  students: number;
  others: number;
  status: "active" | "inactive";
  latestJoin: Date;
  users: InstitutionUser[];
}

export type InstitutionStats = {
  total: number;
  active: number;
  inactive: number;
  totalUsers: number;
}

export type InstitutionFilterState = {
  searchTerm: string;
  statusFilter: string;
  sortBy: string;
}

export const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-red-100 text-red-800";
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
