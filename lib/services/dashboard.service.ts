"use server";

// ============================================
// DASHBOARD SERVICE — Aggregated Stats + Cache
// ============================================

import * as dashboardRepo from "@/lib/repositories/dashboard.repository";
import { cached } from "@/lib/cache/cache.service";
import { CACHE_KEYS } from "@/lib/cache/cache-keys";
import { TAGS } from "@/lib/cache/cache-tags";
import { unstable_cache } from "next/cache";

// ============================================
// SuperAdmin Dashboard
// ============================================

async function _getSuperAdminDashboard() {
  return cached(
    CACHE_KEYS.dashboard.superAdmin(),
    () => dashboardRepo.getSuperAdminStats(),
    180 // 3 minutes for dashboard data
  );
}

export const getSuperAdminDashboard = unstable_cache(
  _getSuperAdminDashboard,
  ["sa-dashboard"],
  { tags: [TAGS.superAdminDashboard] }
);

async function _getRecentActivity() {
  return cached(
    CACHE_KEYS.dashboard.recentActivity(),
    () => dashboardRepo.getRecentActivity(10),
    120 // 2 minutes
  );
}

export const getRecentActivity = unstable_cache(
  _getRecentActivity,
  ["sa-recent-activity"],
  { tags: [TAGS.superAdminDashboard] }
);
