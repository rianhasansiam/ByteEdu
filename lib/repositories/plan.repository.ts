// ============================================
// PLAN REPOSITORY — Pure Prisma Data Access
// ============================================

import { prisma } from "@/lib/prisma";

// ---------- READS ----------

export async function findAll() {
  return prisma.plan.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { subscriptions: true } },
    },
  });
}

export async function findById(id: string) {
  return prisma.plan.findUnique({
    where: { id },
    include: {
      _count: { select: { subscriptions: true } },
    },
  });
}

export async function findByName(name: string) {
  return prisma.plan.findUnique({ where: { name } });
}

// ---------- WRITES ----------

export async function create(data: {
  name: string;
  price: number;
  billingCycle?: string;
  features?: string[];
  isActive?: boolean;
}) {
  return prisma.plan.create({ data });
}

export async function update(
  id: string,
  data: {
    name?: string;
    price?: number;
    billingCycle?: string;
    features?: string[];
    isActive?: boolean;
  }
) {
  return prisma.plan.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.plan.delete({ where: { id } });
}
