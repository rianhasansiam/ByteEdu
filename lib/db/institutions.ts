"use server";

import { updateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";

// ============================================
// QUERIES (READ) - with cache tags
// ============================================

// Get all institutions with their users and computed stats
export const getInstitutionsWithUsers = unstable_cache(
  async () => {
    // Fetch users and institution records in parallel
    const [users, institutionRecords] = await Promise.all([
      prisma.user.findMany({
        where: { institution: { not: null } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          institution: true,
          role: true,
          picture: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.institution.findMany(),
    ]);

    // Build a status lookup from Institution table
    const statusMap = new Map<string, string>();
    for (const rec of institutionRecords) {
      statusMap.set(rec.name, rec.status);
    }

    // Group users by institution
    const institutionMap = new Map<string, typeof users>();
    for (const user of users) {
      const inst = user.institution!;
      if (!institutionMap.has(inst)) {
        institutionMap.set(inst, []);
      }
      institutionMap.get(inst)!.push(user);
    }

    // Build institution data with stats
    const result = Array.from(institutionMap.entries()).map(
      ([name, instUsers]) => {
        const admins = instUsers.filter((u) => u.role === "ADMIN").length;
        const teachers = instUsers.filter((u) => u.role === "TEACHER").length;
        const students = instUsers.filter((u) => u.role === "STUDENT").length;
        const others = instUsers.length - admins - teachers - students;

        const latestJoin = instUsers.reduce(
          (latest, u) => (u.createdAt > latest ? u.createdAt : latest),
          instUsers[0].createdAt
        );

        // Use stored status, or default to "active"
        const status = (statusMap.get(name) || "active") as
          | "active"
          | "inactive";

        return {
          name,
          totalUsers: instUsers.length,
          admins,
          teachers,
          students,
          others,
          status,
          latestJoin,
          users: instUsers,
        };
      }
    );

    // Auto-create Institution records for any that don't exist yet
    const missingNames = result
      .filter((r) => !statusMap.has(r.name))
      .map((r) => r.name);

    if (missingNames.length > 0) {
      await prisma.institution.createMany({
        data: missingNames.map((name) => ({ name, status: "active" })),
        skipDuplicates: true,
      });
    }

    return result;
  },
  ["institutions-with-users"],
  { tags: [CACHE_TAGS.institutions, CACHE_TAGS.users] }
);

// Get overall institution statistics
export const getInstitutionStats = unstable_cache(
  async () => {
    const [institutionRecords, users] = await Promise.all([
      prisma.institution.findMany({ select: { name: true, status: true } }),
      prisma.user.findMany({
        where: { institution: { not: null } },
        select: { institution: true },
      }),
    ]);

    const statusMap = new Map<string, string>();
    for (const rec of institutionRecords) {
      statusMap.set(rec.name, rec.status);
    }

    const institutionNames = new Set(users.map((u) => u.institution!));

    let active = 0;
    let inactive = 0;
    for (const name of institutionNames) {
      const status = statusMap.get(name) || "active";
      if (status === "active") active++;
      else inactive++;
    }

    return {
      total: institutionNames.size,
      active,
      inactive,
      totalUsers: users.length,
    };
  },
  ["institution-stats"],
  { tags: [CACHE_TAGS.institutions, CACHE_TAGS.users] }
);

// ============================================
// MUTATIONS (WRITE) - with updateTag
// ============================================

export async function updateInstitutionStatus(
  name: string,
  status: "active" | "inactive"
) {
  await prisma.institution.upsert({
    where: { name },
    update: { status },
    create: { name, status },
  });

  updateTag(CACHE_TAGS.institutions);
  updateTag(CACHE_TAGS.users);
}
