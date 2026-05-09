import { Suspense } from "react";
import { getPlans } from "@/lib/services/superadmin";
import {
  getSubscriptions,
  getSubscriptionStats,
  getAvailableInstitutions,
} from "@/lib/services/superadmin";
import Hydrate from "@/lib/store/hydrator";
import TabSwitcher from "./components/TabSwitcher";
import PlanCards from "./components/PlanCards";
import { SubscriptionFilterState } from "./components/types";
import AddSubscriptionModal from "./components/AddSubscriptionModal";
import SubscriptionStatsCards from "./components/SubscriptionStatsCards";
import SubscriptionFilters from "./components/SubscriptionFilters";
import SubscriptionList from "./components/SubscriptionList";


type Props = {
  searchParams: Promise<{
    tab?: string;
    search?: string;
    status?: string;
    plan?: string;
    cycle?: string;
  }>;
}

export default async function SubscriptionsPage({ searchParams }: Props) {
  const params = await searchParams;
  const activeTab = params.tab || "plans";

  if (activeTab === "plans") {
    return <PlansTab />;
  }

  return <TrackingTab params={params} />;
}

// ─── Plans Tab ─────────────────────────────────────────
async function PlansTab() {
  const plans = await getPlans();

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">
            Create and manage subscription plans for institutions
          </p>
        </div>
      </div>

      <Suspense fallback={null}>
        <TabSwitcher activeTab="plans" />
      </Suspense>

      <Hydrate name="plans" data={plans} />
      <PlanCards />
    </div>
  );
}

// ─── Tracking Tab ──────────────────────────────────────
async function TrackingTab({
  params,
}: {
  params: { search?: string; status?: string; plan?: string; cycle?: string };
}) {
  // Build filter state from URL
  const filters: SubscriptionFilterState = {
    searchTerm: params.search || "",
    statusFilter: params.status || "ALL",
    planFilter: params.plan || "ALL",
    cycleFilter: params.cycle || "ALL",
  };

  const hasActiveFilters =
    filters.searchTerm !== "" ||
    filters.statusFilter !== "ALL" ||
    filters.planFilter !== "ALL" ||
    filters.cycleFilter !== "ALL";

  // Fetch data with filters
  const [filtered, stats, institutions, plans] = await Promise.all([
    getSubscriptions({
      search: filters.searchTerm || undefined,
      status: filters.statusFilter as any,
      planId: filters.planFilter !== "ALL" ? filters.planFilter : undefined,
      cycle: filters.cycleFilter !== "ALL" ? filters.cycleFilter : undefined,
    }),
    getSubscriptionStats(),
    getAvailableInstitutions(),
    getPlans(),
  ]);

  return (
    <div className="p-8">
      {/* Hydrate Redux Store */}
      <Hydrate name="plans" data={plans} />
      <Hydrate name="subscriptions" data={filtered} />
      <Hydrate name="subscriptionStats" data={stats} />
      <Hydrate name="availableInstitutions" data={institutions} />

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">
            Track subscription payments across all institutions ({filtered.length} shown)
          </p>
        </div>
        <AddSubscriptionModal />
      </div>

      <Suspense fallback={null}>
        <TabSwitcher activeTab="tracking" />
      </Suspense>

      <Suspense fallback={null}>
        <SubscriptionStatsCards statusFilter={filters.statusFilter} />
      </Suspense>

      <Suspense fallback={null}>
        <SubscriptionFilters
          filters={filters}
          hasActiveFilters={hasActiveFilters}
        />
      </Suspense>

      <SubscriptionList
        hasActiveFilters={hasActiveFilters}
      />
    </div>
  );
}
