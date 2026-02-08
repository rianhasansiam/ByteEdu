// Shared types for users components

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  role: string;
  picture: string | null;
  createdAt: Date;
}


export type UserStats = {
  total: number;
  superAdmins: number;
  admins: number;
  teachers: number;
  students: number;
  users: number;
}


export type FilterState = {
  searchTerm: string;
  roleFilter: string;
  institutionFilter: string;
  dateFrom: string;
  dateTo: string;
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
