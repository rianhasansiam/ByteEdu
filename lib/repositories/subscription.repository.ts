// ============================================
// SUBSCRIPTION REPOSITORY — Pure Prisma Data Access
// ============================================

import { prisma } from "@/lib/prisma";

// ---------- READS ----------

export async function findAll() {
  return prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      institution: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true, price: true, billingCycle: true } },
    },
  });
}

export async function findById(id: string) {
  return prisma.subscription.findUnique({
    where: { id },
    include: {
      institution: { select: { id: true, name: true } },
      plan: { select: { id: true, name: true, price: true, billingCycle: true } },
    },
  });
}

export async function getStats() {
  const subscriptions = await prisma.subscription.findMany({
    select: { paymentStatus: true, amount: true },
  });

  let paid = 0;
  let due = 0;
  let overdue = 0;
  let totalRevenue = 0;
  let paidAmount = 0;
  let dueAmount = 0;

  for (const sub of subscriptions) {
    totalRevenue += sub.amount;
    switch (sub.paymentStatus) {
      case "paid":
        paid++;
        paidAmount += sub.amount;
        break;
      case "due":
        due++;
        dueAmount += sub.amount;
        break;
      case "overdue":
        overdue++;
        dueAmount += sub.amount;
        break;
    }
  }

  const totalInstitutions = await prisma.institution.count();

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
}

export async function getAvailableInstitutions() {
  return prisma.institution.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ---------- WRITES ----------

export async function create(data: {
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
  return prisma.subscription.create({ data });
}

export async function update(
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
  return prisma.subscription.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.subscription.delete({ where: { id } });
}
