import { Suspense } from "react";
import { getAllNotices, getNoticeStats } from "@/lib/db/notices";
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

  const [allNotices, stats] = await Promise.all([
    getAllNotices(),
    getNoticeStats(),
  ]);

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

  // Apply filters server-side
  let filtered: NoticeRecord[] = allNotices;

  if (filters.searchTerm) {
    const search = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(
      (n) =>
        n.title.toLowerCase().includes(search) ||
        n.content.toLowerCase().includes(search)
    );
  }

  if (filters.priorityFilter !== "ALL") {
    filtered = filtered.filter((n) => n.priority === filters.priorityFilter);
  }

  if (filters.targetFilter !== "ALL") {
    if (filters.targetFilter === "all") {
      filtered = filtered.filter((n) => n.targetType === "all");
    } else if (filters.targetFilter === "user") {
      filtered = filtered.filter((n) => n.targetType === "user");
    } else if (filters.targetFilter === "institution") {
      filtered = filtered.filter((n) => n.targetType === "institution");
    } else {
      // ADMIN, TEACHER, STUDENT
      filtered = filtered.filter(
        (n) =>
          n.targetType === "role" && n.targetRole === filters.targetFilter
      );
    }
  }

  if (filters.statusFilter !== "ALL") {
    if (filters.statusFilter === "published") {
      filtered = filtered.filter((n) => n.isPublished);
    } else if (filters.statusFilter === "draft") {
      filtered = filtered.filter((n) => !n.isPublished);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notices</h1>
          <p className="text-gray-600 mt-1">
            Create and manage system announcements ({filtered.length} of{" "}
            {allNotices.length} shown)
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
