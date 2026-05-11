"use server";

import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateTag } from "next/cache";
import {
  getFromCache,
  setInCache,
  invalidateSubscriptionCache,
  REDIS_KEYS,
} from "@/lib/redis";

// ============================================
// TYPES
// ============================================

export type SubscriptionFilters = {
  search?: string;
  status?: "paid" | "due" | "overdue" | "ALL";
  planId?: string;
  cycle?: string;
};

export type SubscriptionRecord = {
  id: string;
  institutionId: string;
  institution: {
    id: string;
    name: string;
    status: string;
  };
  planId: string;
  plan: {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
  };
  amount: number;
  paymentStatus: string;
  billingCycle: string;
  startDate: Date;
  endDate: Date;
  paidAt: Date | null;
  transactionId: string | null;
  notes: string | null;
  createdAt: Date;
};

export type SubscriptionStats = {
  total: number;
  paid: number;
  due: number;
  overdue: number;
  totalRevenue: number;
  paidAmount: number;
  dueAmount: number;
  totalInstitutions: number;
};

export type CreateSubscriptionInput = {
  institutionId: string;
  planId: string;
  amount: number;
  billingCycle: string;
  startDate: Date;
  endDate: Date;
  paymentStatus?: "paid" | "due" | "overdue";
  transactionId?: string;
  notes?: string;
};

export type UpdateSubscriptionInput = {
  amount?: number;
  billingCycle?: string;
  startDate?: Date;
  endDate?: Date;
  paymentStatus?: "paid" | "due" | "overdue";
  transactionId?: string;
  notes?: string;
};

// ============================================
// QUERIES
// ============================================

/**
 * Get all subscriptions with optional filtering
 */
export async function getSubscriptions(filters: SubscriptionFilters = {}) {
  const { search, status, planId, cycle } = filters;
  
  // Try cache for unfiltered requests
  const isUnfiltered = !search && (!status || status === "ALL") && !planId && !cycle;
  if (isUnfiltered) {
    const cached = await getFromCache<SubscriptionRecord[]>(REDIS_KEYS.subscriptions());
    if (cached) return cached;
  }
  
  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
  if (search) {
    where.institution = {
      name: { contains: search, mode: "insensitive" },
    };
  }
  
  if (status && status !== "ALL") {
    where.paymentStatus = status;
  }
  
  if (planId && planId !== "ALL") {
    where.planId = planId;
  }
  
  if (cycle && cycle !== "ALL") {
    where.billingCycle = cycle;
  }
  
  const subscriptions = await prisma.subscription.findMany({
    where,
    include: {
      institution: {
        select: { id: true, name: true, status: true },
      },
      plan: {
        select: { id: true, name: true, price: true, billingCycle: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  // Cache unfiltered results
  if (isUnfiltered) {
    await setInCache(REDIS_KEYS.subscriptions(), subscriptions, 300);
  }
  
  return subscriptions;
}

/**
 * Get subscription by ID
 */
export async function getSubscriptionById(id: string) {
  const cached = await getFromCache<SubscriptionRecord>(REDIS_KEYS.subscriptionById(id));
  if (cached) return cached;
  
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      institution: {
        select: { id: true, name: true, status: true },
      },
      plan: {
        select: { id: true, name: true, price: true, billingCycle: true },
      },
    },
  });
  
  if (subscription) {
    await setInCache(REDIS_KEYS.subscriptionById(id), subscription, 300);
  }
  
  return subscription;
}

/**
 * Get subscription statistics
 */
export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  const cached = await getFromCache<SubscriptionStats>(REDIS_KEYS.subscriptionStats());
  if (cached) return cached;
  
  const subscriptions = await prisma.subscription.findMany({
    select: { paymentStatus: true, amount: true },
  });
  
  const totalInstitutions = await prisma.institution.count();
  
  let totalRevenue = 0;
  let paid = 0;
  let due = 0;
  let overdue = 0;
  let paidAmount = 0;
  let dueAmount = 0;
  
  for (const sub of subscriptions) {
    totalRevenue += sub.amount;
    if (sub.paymentStatus === "paid") {
      paid++;
      paidAmount += sub.amount;
    } else if (sub.paymentStatus === "due") {
      due++;
      dueAmount += sub.amount;
    } else {
      overdue++;
      dueAmount += sub.amount;
    }
  }
  
  const stats: SubscriptionStats = {
    total: subscriptions.length,
    paid,
    due,
    overdue,
    totalRevenue,
    paidAmount,
    dueAmount,
    totalInstitutions,
  };
  
  await setInCache(REDIS_KEYS.subscriptionStats(), stats, 300);
  return stats;
}

/**
 * Get institutions available for subscription (dropdown)
 */
export async function getAvailableInstitutions() {
  const institutions = await prisma.institution.findMany({
    select: { id: true, name: true },
    where: { status: "active" },
    orderBy: { name: "asc" },
  });
  return institutions;
}

/**
 * Get all plans for subscription form
 */
export async function getPlans() {
  const cached = await getFromCache<{
    id: string;
    name: string;
    price: number;
    billingCycle: string;
    features: string[];
    isActive: boolean;
  }[]>(REDIS_KEYS.plans());
  if (cached) return cached;
  
  const plans = await prisma.plan.findMany({
    orderBy: { price: "asc" },
  });
  
  await setInCache(REDIS_KEYS.plans(), plans, 600);
  return plans;
}

/**
 * Get active plans only
 */
export async function getActivePlans() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
  });
  return plans;
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new subscription
 */
export async function createSubscription(data: CreateSubscriptionInput) {
  // Validate institution exists
  const institution = await prisma.institution.findUnique({
    where: { id: data.institutionId },
  });
  if (!institution) {
    throw new Error("Institution not found");
  }
  
  // Validate plan exists
  const plan = await prisma.plan.findUnique({
    where: { id: data.planId },
  });
  if (!plan) {
    throw new Error("Plan not found");
  }
  
  const subscription = await prisma.subscription.create({
    data: {
      institutionId: data.institutionId,
      planId: data.planId,
      amount: data.amount,
      billingCycle: data.billingCycle,
      startDate: data.startDate,
      endDate: data.endDate,
      paymentStatus: data.paymentStatus || "due",
      transactionId: data.transactionId,
      notes: data.notes,
      paidAt: data.paymentStatus === "paid" ? new Date() : null,
    },
    include: {
      institution: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true } },
    },
  });
  
  // Invalidate caches
  await invalidateSubscriptionCache();
  revalidateTag(CACHE_TAGS.subscriptions, { expire: 0 });
  
  return subscription;
}

/**
 * Update a subscription
 */
export async function updateSubscription(id: string, data: UpdateSubscriptionInput) {
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Subscription not found");
  }
  
  // Handle paidAt timestamp when status changes to paid
  const paidAt = data.paymentStatus === "paid" && existing.paymentStatus !== "paid"
    ? new Date()
    : data.paymentStatus !== "paid"
    ? null
    : existing.paidAt;
  
  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      amount: data.amount,
      billingCycle: data.billingCycle,
      startDate: data.startDate,
      endDate: data.endDate,
      paymentStatus: data.paymentStatus,
      transactionId: data.transactionId,
      notes: data.notes,
      paidAt,
    },
    include: {
      institution: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true } },
    },
  });
  
  // Invalidate caches
  await invalidateSubscriptionCache();
  revalidateTag(CACHE_TAGS.subscriptions, { expire: 0 });
  
  return subscription;
}

/**
 * Update subscription payment status
 */
export async function updateSubscriptionStatus(
  id: string,
  paymentStatus: "paid" | "due" | "overdue"
) {
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Subscription not found");
  }
  
  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      paymentStatus,
      paidAt: paymentStatus === "paid" ? new Date() : null,
    },
  });
  
  // Invalidate caches
  await invalidateSubscriptionCache();
  revalidateTag(CACHE_TAGS.subscriptions, { expire: 0 });
  
  return subscription;
}

/**
 * Delete a subscription
 */
export async function deleteSubscription(id: string) {
  const existing = await prisma.subscription.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Subscription not found");
  }
  
  await prisma.subscription.delete({ where: { id } });
  
  // Invalidate caches
  await invalidateSubscriptionCache();
  revalidateTag(CACHE_TAGS.subscriptions, { expire: 0 });
  
  return { success: true };
}

// ============================================
// PLAN MUTATIONS
// ============================================

export type CreatePlanInput = {
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
};

export type UpdatePlanInput = {
  name?: string;
  price?: number;
  billingCycle?: string;
  features?: string[];
  isActive?: boolean;
};

/**
 * Create a new plan
 */
export async function createPlan(data: CreatePlanInput) {
  const plan = await prisma.plan.create({
    data: {
      name: data.name,
      price: data.price,
      billingCycle: data.billingCycle,
      features: data.features,
    },
  });
  
  revalidateTag(CACHE_TAGS.plans, { expire: 0 });
  return plan;
}

/**
 * Update a plan
 */
export async function updatePlan(id: string, data: UpdatePlanInput) {
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Plan not found");
  }
  
  const plan = await prisma.plan.update({
    where: { id },
    data: {
      name: data.name,
      price: data.price,
      billingCycle: data.billingCycle,
      features: data.features,
      isActive: data.isActive,
    },
  });
  
  revalidateTag(CACHE_TAGS.plans, { expire: 0 });
  return plan;
}

/**
 * Toggle plan active status
 */
export async function togglePlanStatus(id: string) {
  const existing = await prisma.plan.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Plan not found");
  }
  
  const plan = await prisma.plan.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  
  revalidateTag(CACHE_TAGS.plans, { expire: 0 });
  return plan;
}

/**
 * Delete a plan
 */
export async function deletePlan(id: string) {
  // Check if plan has subscriptions
  const subscriptionCount = await prisma.subscription.count({
    where: { planId: id },
  });
  
  if (subscriptionCount > 0) {
    throw new Error(
      `Cannot delete a plan with ${subscriptionCount} active subscription(s)`
    );
  }
  
  await prisma.plan.delete({ where: { id } });
  revalidateTag(CACHE_TAGS.plans, { expire: 0 });
  
  return { success: true };
}
