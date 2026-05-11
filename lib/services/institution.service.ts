"use server";

// ============================================
// INSTITUTION SERVICE — Business Logic + Cache Orchestration
// ============================================
// Flow: Service → Redis (via cached()) → Repository → Prisma → PostgreSQL
// Mutations: Repository → invalidate Redis → revalidateTag (Next.js)

import * as repo from "@/lib/repositories/institution.repository";
import { cached, invalidate, invalidateMany, invalidatePattern } from "@/lib/cache/cache.service";
import { CACHE_KEYS, INVALIDATION_PATTERNS } from "@/lib/cache/cache-keys";
import { TAGS, getInstitutionRelatedTags, revalidateTags } from "@/lib/cache/cache-tags";
import { unstable_cache } from "next/cache";

// ============================================
// TYPES
// ============================================

export type InstitutionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  picture: string | null;
  createdAt: Date;
};

export type InstitutionData = {
  id: string;
  name: string;
  status: "active" | "inactive";
  totalUsers: number;
  admins: number;
  teachers: number;
  students: number;
  others: number;
  latestJoin: Date;
  users: InstitutionUser[];
  createdAt: Date;
};

export type InstitutionStats = {
  total: number;
  active: number;
  inactive: number;
  totalUsers: number;
};

// ============================================
// READS (Redis + Next.js Cache chain)
// ============================================

/**
 * Get all institutions with computed stats.
 * Chain: unstable_cache → cached(Redis) → repository → Prisma
 */
async function _getInstitutions(): Promise<InstitutionData[]> {
  return cached(CACHE_KEYS.institutions.all(), async () => {
    const raw = await repo.findAll();

    return raw.map((inst) => {
      const admins = inst.users.filter((u) => u.role === "ADMIN").length;
      const teachers = inst.users.filter((u) => u.role === "TEACHER").length;
      const students = inst.users.filter((u) => u.role === "STUDENT").length;
      const others = inst.users.length - admins - teachers - students;

      const latestJoin =
        inst.users.length > 0
          ? inst.users.reduce(
              (latest, u) => (u.createdAt > latest ? u.createdAt : latest),
              inst.users[0].createdAt
            )
          : inst.createdAt;

      return {
        id: inst.id,
        name: inst.name,
        status: inst.status as "active" | "inactive",
        totalUsers: inst.users.length,
        admins,
        teachers,
        students,
        others,
        latestJoin,
        users: inst.users,
        createdAt: inst.createdAt,
      };
    });
  });
}

/** Next.js cached wrapper — call this from Server Components */
export const getInstitutions = unstable_cache(
  _getInstitutions,
  ["institutions-all"],
  { tags: [TAGS.institutions] }
);

/** Get institution stats */
async function _getInstitutionStats(): Promise<InstitutionStats> {
  return cached(CACHE_KEYS.institutions.stats(), () => repo.getStats());
}

export const getInstitutionStats = unstable_cache(
  _getInstitutionStats,
  ["institution-stats"],
  { tags: [TAGS.institutionStats] }
);

/** Get institution by ID (Redis only, no unstable_cache needed for single-entity) */
export async function getInstitutionById(id: string) {
  return cached(CACHE_KEYS.institutions.byId(id), () => repo.findById(id));
}

/** Get simple list for dropdowns */
export async function getInstitutionList() {
  return repo.findAllSimple();
}

// ============================================
// MUTATIONS (DB write → Redis invalidate → Next.js revalidate)
// ============================================

/** Invalidate all institution-related caches across both layers */
async function invalidateInstitutionCaches(institutionId?: string) {
  // 1. Invalidate Redis keys
  await invalidateMany([
    CACHE_KEYS.institutions.all(),
    CACHE_KEYS.institutions.stats(),
    CACHE_KEYS.dashboard.superAdmin(),
  ]);

  if (institutionId) {
    await invalidate(CACHE_KEYS.institutions.byId(institutionId));
    await invalidatePattern(INVALIDATION_PATTERNS.allForInstitution(institutionId));
  }

  // 2. Revalidate Next.js cache tags
  await revalidateTags(getInstitutionRelatedTags(institutionId));
}

export async function createInstitution(data: { name: string; status?: string }) {
  // Business validation
  const existing = await repo.findByName(data.name);
  if (existing) {
    throw new Error("An institution with this name already exists");
  }

  // Write to DB
  const institution = await repo.create(data);

  // Invalidate both cache layers
  await invalidateInstitutionCaches();

  return institution;
}

export async function updateInstitution(
  id: string,
  data: { name?: string; status?: string }
) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Institution not found");

  // Check name uniqueness
  if (data.name && data.name !== existing.name) {
    const nameExists = await repo.findByName(data.name);
    if (nameExists) throw new Error("An institution with this name already exists");
  }

  const institution = await repo.update(id, data);

  // Invalidate both cache layers
  await invalidateInstitutionCaches(id);

  return institution;
}

export async function toggleInstitutionStatus(id: string) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Institution not found");

  const newStatus = existing.status === "active" ? "inactive" : "active";
  const institution = await repo.update(id, { status: newStatus });

  await invalidateInstitutionCaches(id);

  return institution;
}

export async function deleteInstitution(id: string) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Institution not found");

  if (existing._count.users > 0) {
    throw new Error(
      `Cannot delete institution with ${existing._count.users} user(s). Remove all users first.`
    );
  }
  if (existing._count.subscriptions > 0) {
    throw new Error(
      `Cannot delete institution with ${existing._count.subscriptions} subscription(s). Remove all subscriptions first.`
    );
  }

  await repo.remove(id);
  await invalidateInstitutionCaches(id);

  return { success: true };
}
