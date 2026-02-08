"use server";

import { updateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";

// ============================================
// QUERIES (READ) - with cache tags
// ============================================

// Get all subscriptions with institution and plan info
export const getAllSubscriptions = unstable_cache(
  async () => {
    return prisma.subscription.findMany({
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
  },
  ["all-subscriptions"],
  { tags: [CACHE_TAGS.subscriptions, CACHE_TAGS.institutions, CACHE_TAGS.plans] }
);

// Get subscription stats
export const getSubscriptionStats = unstable_cache(
  async () => {
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

    return {
      total: subscriptions.length,
      paid,
      due,
      overdue,
      totalRevenue,
      paidAmount,
      dueAmount,
      totalInstitutions,
    };
  },
  ["subscription-stats"],
  { tags: [CACHE_TAGS.subscriptions] }
);

// Get institutions for dropdown
export const getSubscribedInstitutions = unstable_cache(
  async () => {
    return prisma.institution.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  },
  ["subscribed-institutions"],
  { tags: [CACHE_TAGS.institutions] }
);

// ============================================
// MUTATIONS (WRITE) - with updateTag
// ============================================

export async function createSubscription(data: {
  institutionId: string;
  planId: string;
  amount: number;
  billingCycle: string;
  startDate: Date;
  endDate: Date;
  paymentStatus?: string;
  transactionId?: string;
  notes?: string;
}) {
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
  });

  updateTag(CACHE_TAGS.subscriptions);
  return subscription;
}

export async function updateSubscriptionStatus(
  id: string,
  paymentStatus: "paid" | "due" | "overdue"
) {
  const subscription = await prisma.subscription.update({
    where: { id },
    data: {
      paymentStatus,
      paidAt: paymentStatus === "paid" ? new Date() : null,
    },
  });

  updateTag(CACHE_TAGS.subscriptions);
  return subscription;
}

export async function deleteSubscription(id: string) {
  await prisma.subscription.delete({ where: { id } });
  updateTag(CACHE_TAGS.subscriptions);
}
