"use server";

// ============================================
// SUBSCRIPTION SERVICE — Business Logic + Cache Orchestration
// ============================================

import * as repo from "@/lib/repositories/subscription.repository";
import { cached, invalidate, invalidateMany, invalidatePattern } from "@/lib/cache/cache.service";
import { CACHE_KEYS, INVALIDATION_PATTERNS } from "@/lib/cache/cache-keys";
import { TAGS, getSubscriptionRelatedTags, revalidateTags } from "@/lib/cache/cache-tags";
import { unstable_cache } from "next/cache";

// ============================================
// READS
// ============================================

async function _getAllSubscriptions() {
  return cached(CACHE_KEYS.subscriptions.all(), () => repo.findAll());
}

export const getAllSubscriptions = unstable_cache(
  _getAllSubscriptions,
  ["all-subscriptions"],
  { tags: [TAGS.subscriptions] }
);

async function _getSubscriptionStats() {
  return cached(CACHE_KEYS.subscriptions.stats(), () => repo.getStats());
}

export const getSubscriptionStats = unstable_cache(
  _getSubscriptionStats,
  ["subscription-stats"],
  { tags: [TAGS.subscriptionStats] }
);

export async function getSubscriptionById(id: string) {
  return cached(CACHE_KEYS.subscriptions.byId(id), () => repo.findById(id));
}

async function _getAvailableInstitutions() {
  return cached(
    CACHE_KEYS.subscriptions.availableInstitutions(),
    () => repo.getAvailableInstitutions()
  );
}

export const getAvailableInstitutions = unstable_cache(
  _getAvailableInstitutions,
  ["available-institutions"],
  { tags: [TAGS.institutions] }
);

// ============================================
// MUTATIONS
// ============================================

async function invalidateSubscriptionCaches(institutionId?: string) {
  await invalidateMany([
    CACHE_KEYS.subscriptions.all(),
    CACHE_KEYS.subscriptions.stats(),
    CACHE_KEYS.subscriptions.availableInstitutions(),
    CACHE_KEYS.dashboard.superAdmin(),
  ]);

  if (institutionId) {
    await invalidate(CACHE_KEYS.admin.subscription(institutionId));
    await invalidate(CACHE_KEYS.admin.dashboard(institutionId));
  }

  await revalidateTags(getSubscriptionRelatedTags());
}

export async function createSubscription(data: {
  institutionId: string;
  planId: string;
  amount: number;
  billingCycle?: string;
  startDate?: Date;
  endDate: Date;
  paymentStatus?: string;
  transactionId?: string;
  notes?: string;
}) {
  const subscription = await repo.create(data);
  await invalidateSubscriptionCaches(data.institutionId);
  return subscription;
}

export async function updateSubscription(
  id: string,
  data: {
    planId?: string;
    amount?: number;
    paymentStatus?: string;
    billingCycle?: string;
    endDate?: Date;
    paidAt?: Date | null;
    transactionId?: string;
    notes?: string;
  }
) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Subscription not found");

  const subscription = await repo.update(id, data);
  await invalidate(CACHE_KEYS.subscriptions.byId(id));
  await invalidateSubscriptionCaches(existing.institutionId);
  return subscription;
}

export async function deleteSubscription(id: string) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Subscription not found");

  await repo.remove(id);
  await invalidate(CACHE_KEYS.subscriptions.byId(id));
  await invalidateSubscriptionCaches(existing.institutionId);
  return { success: true };
}
