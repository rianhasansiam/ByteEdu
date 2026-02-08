"use server";

import { updateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";

// ============================================
// QUERIES (READ) - with cache tags
// ============================================

export const getAllPlans = unstable_cache(
  async () => {
    return prisma.plan.findMany({
      orderBy: { price: "asc" },
    });
  },
  ["all-plans"],
  { tags: [CACHE_TAGS.plans] }
);

export const getActivePlans = unstable_cache(
  async () => {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
  },
  ["active-plans"],
  { tags: [CACHE_TAGS.plans] }
);

// ============================================
// MUTATIONS (WRITE) - with updateTag
// ============================================

export async function createPlan(data: {
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
}) {
  const plan = await prisma.plan.create({
    data: {
      name: data.name,
      price: data.price,
      billingCycle: data.billingCycle,
      features: data.features,
    },
  });

  updateTag(CACHE_TAGS.plans);
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
  const plan = await prisma.plan.update({
    where: { id },
    data,
  });

  updateTag(CACHE_TAGS.plans);
  return plan;
}

export async function deletePlan(id: string) {
  // Check if plan has subscriptions
  const count = await prisma.subscription.count({ where: { planId: id } });
  if (count > 0) {
    throw new Error("Cannot delete a plan with active subscriptions");
  }

  await prisma.plan.delete({ where: { id } });
  updateTag(CACHE_TAGS.plans);
}

export async function togglePlanStatus(id: string) {
  const plan = await prisma.plan.findUnique({ where: { id } });
  if (!plan) throw new Error("Plan not found");

  const updated = await prisma.plan.update({
    where: { id },
    data: { isActive: !plan.isActive },
  });

  updateTag(CACHE_TAGS.plans);
  return updated;
}
