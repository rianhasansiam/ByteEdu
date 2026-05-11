"use server";

// ============================================
// PLAN SERVICE — Business Logic + Cache Orchestration
// ============================================

import * as repo from "@/lib/repositories/plan.repository";
import { cached, invalidate, invalidateMany } from "@/lib/cache/cache.service";
import { CACHE_KEYS } from "@/lib/cache/cache-keys";
import { TAGS, revalidateTags } from "@/lib/cache/cache-tags";
import { unstable_cache } from "next/cache";

// ============================================
// READS
// ============================================

async function _getAllPlans() {
  return cached(CACHE_KEYS.plans.all(), () => repo.findAll());
}

export const getAllPlans = unstable_cache(
  _getAllPlans,
  ["all-plans"],
  { tags: [TAGS.plans] }
);

export async function getPlanById(id: string) {
  return cached(CACHE_KEYS.plans.byId(id), () => repo.findById(id));
}

// ============================================
// MUTATIONS
// ============================================

async function invalidatePlanCaches() {
  await invalidateMany([
    CACHE_KEYS.plans.all(),
    CACHE_KEYS.dashboard.superAdmin(),
  ]);
  await revalidateTags([TAGS.plans, TAGS.superAdminDashboard]);
}

export async function createPlan(data: {
  name: string;
  price: number;
  billingCycle?: string;
  features?: string[];
  isActive?: boolean;
}) {
  const existing = await repo.findByName(data.name);
  if (existing) throw new Error("A plan with this name already exists");

  const plan = await repo.create(data);
  await invalidatePlanCaches();
  return plan;
}

export async function updatePlan(
  id: string,
  data: {
    name?: string;
    price?: number;
    billingCycle?: string;
    features?: string[];
    isActive?: boolean;
  }
) {
  if (data.name) {
    const existing = await repo.findByName(data.name);
    if (existing && existing.id !== id) {
      throw new Error("A plan with this name already exists");
    }
  }

  const plan = await repo.update(id, data);
  await invalidate(CACHE_KEYS.plans.byId(id));
  await invalidatePlanCaches();
  return plan;
}

export async function deletePlan(id: string) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Plan not found");

  if (existing._count.subscriptions > 0) {
    throw new Error(
      `Cannot delete plan with ${existing._count.subscriptions} active subscription(s).`
    );
  }

  await repo.remove(id);
  await invalidate(CACHE_KEYS.plans.byId(id));
  await invalidatePlanCaches();
  return { success: true };
}
