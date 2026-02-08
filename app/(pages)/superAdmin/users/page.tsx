import Link from "next/link";
import { getAllUsers, getUniqueInstitutions, getUserStats } from "@/lib/db/users";
import { FilterState } from "./components/types";
import UserStatsCardsClient from "./components/UserStatsCards";
import UsersFiltersClient from "./components/UsersFilters";
import UsersTableClient from "./components/UsersTable";


type PageProps = {
  searchParams: Promise<{
    search?: string;
    role?: string;
    institution?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  const [allUsers, institutions, stats] = await Promise.all([
    getAllUsers(),
    getUniqueInstitutions(),
    getUserStats(),
  ]);



  // Build filters from search params
  const filters: FilterState = {
    searchTerm: params.search || "",
    roleFilter: params.role || "ALL",
    institutionFilter: params.institution || "ALL",
    dateFrom: params.dateFrom || "",
    dateTo: params.dateTo || "",
  };



  // Filter users on server
  const filteredUsers = (allUsers as User[]).filter((user) => {
    const matchesSearch =
      filters.searchTerm === "" ||
      user.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (user.phone && user.phone.includes(filters.searchTerm));

    const matchesRole = filters.roleFilter === "ALL" || user.role === filters.roleFilter;

    const matchesInstitution =
      filters.institutionFilter === "ALL" ||
      (filters.institutionFilter === "NONE" && !user.institution) ||
      user.institution === filters.institutionFilter;

    const userDate = new Date(user.createdAt);
    const matchesDateFrom = !filters.dateFrom || userDate >= new Date(filters.dateFrom);
    const matchesDateTo = !filters.dateTo || userDate <= new Date(filters.dateTo + "T23:59:59");

    return matchesSearch && matchesRole && matchesInstitution && matchesDateFrom && matchesDateTo;
  });



  const hasActiveFilters =
    filters.searchTerm ||
    filters.roleFilter !== "ALL" ||
    filters.institutionFilter !== "ALL" ||
    filters.dateFrom ||
    filters.dateTo;



    
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">
            Manage all users in the system ({filteredUsers.length} of {allUsers.length} shown)
          </p>
        </div>

        <div className="flex gap-3">
          <Link href="/adminSignup" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
            + Add Admin
          </Link>
          <Link href="/teacherSignup" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
            + Add Teacher
          </Link>
          <Link href="/studentSignup" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
            + Add Student
          </Link>
        </div>


      </div>

      <UserStatsCardsClient stats={stats} roleFilter={filters.roleFilter} />
      <UsersFiltersClient filters={filters} institutions={institutions} hasActiveFilters={!!hasActiveFilters} />
      <UsersTableClient users={filteredUsers} hasActiveFilters={!!hasActiveFilters} />


    </div>
  );
}
