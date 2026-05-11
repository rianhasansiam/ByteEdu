"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";

// ============================================
// QUERIES (READ) - with cache tags
// ============================================

// Get all institutions with their users and computed stats
export const getInstitutionsWithUsers = unstable_cache(
  async () => {
    // Fetch institutions with their users
    const institutions = await prisma.institution.findMany({
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
    });

    // Build institution data with stats
    const result = institutions.map((inst) => {
      const instUsers = inst.users;
      const admins = instUsers.filter((u) => u.role === "ADMIN").length;
      const teachers = instUsers.filter((u) => u.role === "TEACHER").length;
      const students = instUsers.filter((u) => u.role === "STUDENT").length;
      const others = instUsers.length - admins - teachers - students;

      const latestJoin = instUsers.length > 0
        ? instUsers.reduce(
            (latest, u) => (u.createdAt > latest ? u.createdAt : latest),
            instUsers[0].createdAt
          )
        : inst.createdAt;

      return {
        id: inst.id,
        name: inst.name,
        totalUsers: instUsers.length,
        admins,
        teachers,
        students,
        others,
        status: inst.status as "active" | "inactive",
        latestJoin,
        users: instUsers.map((u) => ({
          ...u,
          institution: inst.name,
        })),
      };
    });

    return result;
  },
  ["institutions-with-users"],
  { tags: [CACHE_TAGS.institutions, CACHE_TAGS.users] }
);

// Get overall institution statistics
export const getInstitutionStats = unstable_cache(
  async () => {
    const institutions = await prisma.institution.findMany({
      select: { 
        id: true,
        name: true, 
        status: true,
        _count: {
          select: { users: true },
        },
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
  },
  ["institution-stats"],
  { tags: [CACHE_TAGS.institutions, CACHE_TAGS.users] }
);

// Get institution by ID
export const getInstitutionById = unstable_cache(
  async (id: string) => {
    return prisma.institution.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },
  ["institution-by-id"],
  { tags: [CACHE_TAGS.institutions] }
);

// Get all institutions (simple list)
export const getAllInstitutions = unstable_cache(
  async () => {
    return prisma.institution.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: { name: "asc" },
    });
  },
  ["all-institutions"],
  { tags: [CACHE_TAGS.institutions] }
);

// ============================================
// MUTATIONS (WRITE) - with updateTag
// ============================================

export async function createInstitution(data: {
  name: string;
  status?: "active" | "inactive";
}) {
  const institution = await prisma.institution.create({
    data: {
      name: data.name,
      status: data.status || "active",
    },
  });

  revalidateTag(CACHE_TAGS.institutions, { expire: 0 });
  return institution;
}

export async function updateInstitutionStatus(
  id: string,
  status: "active" | "inactive"
) {
  await prisma.institution.update({
    where: { id },
    data: { status },
  });

  revalidateTag(CACHE_TAGS.institutions, { expire: 0 });
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
}

// Legacy function - update by name (for backward compatibility)
export async function updateInstitutionStatusByName(
  name: string,
  status: "active" | "inactive"
) {
  await prisma.institution.upsert({
    where: { name },
    update: { status },
    create: { name, status },
  });

  revalidateTag(CACHE_TAGS.institutions, { expire: 0 });
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
}
