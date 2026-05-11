// ============================================
// INSTITUTION REPOSITORY — Pure Prisma Data Access
// ============================================
// No caching, no business logic. Just DB queries.

import { prisma } from "@/lib/prisma";

// ---------- READS ----------

export async function findAll() {
  return prisma.institution.findMany({
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          picture: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function findById(id: string) {
  return prisma.institution.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          picture: true,
          createdAt: true,
        },
      },
      _count: { select: { users: true, subscriptions: true } },
    },
  });
}

export async function findByName(name: string) {
  return prisma.institution.findUnique({ where: { name } });
}

export async function findAllSimple() {
  return prisma.institution.findMany({
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });
}

export async function getStats() {
  const institutions = await prisma.institution.findMany({
    select: {
      status: true,
      _count: { select: { users: true } },
    },
  });

  let active = 0;
  let inactive = 0;
  let totalUsers = 0;

  for (const inst of institutions) {
    if (inst.status === "active") active++;
    else inactive++;
    totalUsers += inst._count.users;
  }

  return {
    total: institutions.length,
    active,
    inactive,
    totalUsers,
  };
}

// ---------- WRITES ----------

export async function create(data: { name: string; status?: string }) {
  return prisma.institution.create({
    data: { name: data.name, status: data.status || "active" },
  });
}

export async function update(
  id: string,
  data: { name?: string; status?: string }
) {
  return prisma.institution.update({
    where: { id },
    data,
  });
}

export async function remove(id: string) {
  return prisma.institution.delete({ where: { id } });
}
