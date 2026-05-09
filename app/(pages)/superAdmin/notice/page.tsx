import { Suspense } from "react";
import { getNotices, getNoticeStats } from "@/lib/services/superadmin";
import Hydrate from "@/lib/store/hydrator";
import { NoticeFilterState, NoticeRecord } from "./components/types";
import NoticeStatsCards from "./components/NoticeStatsCards";
import NoticeFilters from "./components/NoticeFilters";
import NoticeList from "./components/NoticeList";
import CreateNoticeModal from "./components/CreateNoticeModal";

type Props = {
  searchParams: Promise<{
    search?: string;
    priority?: string;
    target?: string;
    status?: string;
  }>;
};

export default async function NoticePage({ searchParams }: Props) {
  const params = await searchParams;

  // Build filter state from URL
  const filters: NoticeFilterState = {
    searchTerm: params.search || "",
    priorityFilter: params.priority || "ALL",
    targetFilter: params.target || "ALL",
    statusFilter: params.status || "ALL",
  };

  const hasActiveFilters =
    filters.searchTerm !== "" ||
    filters.priorityFilter !== "ALL" ||
    filters.targetFilter !== "ALL" ||
    filters.statusFilter !== "ALL";

  // Fetch data with filters
  const [filtered, stats] = await Promise.all([
    getNotices({
      search: filters.searchTerm || undefined,
      priority: filters.priorityFilter as any,
      targetType: filters.targetFilter !== "ALL" ? (filters.targetFilter as any) : undefined,
      status: filters.statusFilter as any,
    }),
    getNoticeStats(),
  ]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-600 mt-1">
            Create and manage system announcements ({filtered.length} shown)
          </p>
        </div>
        <CreateNoticeModal />
      </div>

      {/* Hydrate Redux Store */}
      <Hydrate name="notices" data={filtered} />
      <Hydrate name="noticeStats" data={stats} />

      {/* Stats */}
      <Suspense fallback={null}>
        <NoticeStatsCards statusFilter={filters.statusFilter} />
      </Suspense>

      {/* Filters */}
      <Suspense fallback={null}>
        <NoticeFilters filters={filters} hasActiveFilters={hasActiveFilters} />
      </Suspense>

      {/* Notice List */}
      <NoticeList hasActiveFilters={hasActiveFilters} />
    </div>
  );
}
