import {
  getInstitutionsWithUsers,
  getInstitutionStats,
} from "@/lib/db/institutions";
import Hydrate from "@/lib/store/hydrator";
import { InstitutionData, InstitutionFilterState } from "./components/types";
import InstitutionStatsCards from "./components/InstitutionStatsCards";
import InstitutionFilters from "./components/InstitutionFilters";
import InstitutionCards from "./components/InstitutionCards";


type PageProps = {
  searchParams: Promise<{
    search?: string;
    status?: string;
    sort?: string;
  }>;
}

export default async function InstitutionPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const [institutions, stats] = await Promise.all([
    getInstitutionsWithUsers(),
    getInstitutionStats(),
  ]);

  // Build filters from search params
  const filters: InstitutionFilterState = {
    searchTerm: params.search || "",
    statusFilter: params.status || "ALL",
    sortBy: params.sort || "name",
  };

  // Filter institutions on server
  let filtered = (institutions as InstitutionData[]).filter((inst) => {
    const matchesSearch =
      !filters.searchTerm ||
      inst.name.toLowerCase().includes(filters.searchTerm.toLowerCase());

    const matchesStatus =
      filters.statusFilter === "ALL" ||
      inst.status === filters.statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort institutions
  switch (filters.sortBy) {
    case "users":
      filtered.sort((a, b) => b.totalUsers - a.totalUsers);
      break;
    case "latest":
      filtered.sort(
        (a, b) =>
          new Date(b.latestJoin).getTime() - new Date(a.latestJoin).getTime()
      );
      break;
    case "name":
    default:
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }

  const hasActiveFilters =
    filters.searchTerm ||
    filters.statusFilter !== "ALL" ||
    filters.sortBy !== "name";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Institutions</h1>
          <p className="text-gray-600 mt-1">
            Manage registered institutions ({filtered.length} of{" "}
            {institutions.length} shown)
          </p>
        </div>
      </div>

      <Hydrate name="institutions" data={filtered} />
      <Hydrate name="institutionStats" data={stats} />

      <InstitutionStatsCards statusFilter={filters.statusFilter} />
      <InstitutionFilters
        filters={filters}
        hasActiveFilters={!!hasActiveFilters}
      />
      <InstitutionCards
        hasActiveFilters={!!hasActiveFilters}
      />
    </div>
  );
}
