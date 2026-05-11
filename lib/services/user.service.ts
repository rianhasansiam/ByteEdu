"use server";

// ============================================
// USER SERVICE — Business Logic + Cache Orchestration
// ============================================

import * as repo from "@/lib/repositories/user.repository";
import { cached, invalidate, invalidateMany, invalidatePattern } from "@/lib/cache/cache.service";
import { CACHE_KEYS, INVALIDATION_PATTERNS } from "@/lib/cache/cache-keys";
import { TAGS, getUserRelatedTags, revalidateTags } from "@/lib/cache/cache-tags";
import { unstable_cache } from "next/cache";
import { Role } from "../../app/generated/prisma/client";

// ============================================
// READS
// ============================================

async function _getAllUsers() {
  return cached(CACHE_KEYS.users.all(), () => repo.findAll());
}

export const getAllUsers = unstable_cache(
  _getAllUsers,
  ["all-users"],
  { tags: [TAGS.users] }
);

async function _getUserStats() {
  return cached(CACHE_KEYS.users.stats(), () => repo.getStats());
}

export const getUserStats = unstable_cache(
  _getUserStats,
  ["user-stats"],
  { tags: [TAGS.userStats] }
);

async function _getUniqueInstitutions() {
  return cached(CACHE_KEYS.users.institutions(), () => repo.getUniqueInstitutions());
}

export const getUniqueInstitutions = unstable_cache(
  _getUniqueInstitutions,
  ["unique-institutions"],
  { tags: [TAGS.userInstitutions, TAGS.institutions] }
);

export async function getUserById(id: string) {
  return cached(CACHE_KEYS.users.byId(id), () => repo.findById(id));
}

export async function getUserByEmail(email: string) {
  return repo.findByEmail(email);
}

// ============================================
// MUTATIONS
// ============================================

async function invalidateUserCaches(userId?: string, institutionId?: string) {
  // 1. Invalidate Redis
  await invalidateMany([
    CACHE_KEYS.users.all(),
    CACHE_KEYS.users.stats(),
    CACHE_KEYS.users.institutions(),
    CACHE_KEYS.dashboard.superAdmin(),
  ]);

  if (userId) {
    await invalidate(CACHE_KEYS.users.byId(userId));
  }
  if (institutionId) {
    await invalidatePattern(INVALIDATION_PATTERNS.allForInstitution(institutionId));
  }

  // 2. Revalidate Next.js cache tags
  await revalidateTags(getUserRelatedTags(userId));
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  institutionId?: string;
  role?: Role;
  picture?: string;
  teacherId?: string;
  sectionId?: string;
  roll?: string;
}) {
  const existing = await repo.findByEmail(data.email);
  if (existing) throw new Error("A user with this email already exists");

  const user = await repo.create(data);
  await invalidateUserCaches(undefined, data.institutionId);

  return user;
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    institutionId?: string | null;
    password?: string;
    role?: Role;
    picture?: string;
    sectionId?: string | null;
    roll?: string;
  }
) {
  const user = await repo.update(id, data);
  await invalidateUserCaches(id, data.institutionId || undefined);
  return user;
}

export async function deleteUser(id: string) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("User not found");

  await repo.remove(id);
  await invalidateUserCaches(id, existing.institutionId || undefined);
}

export async function updateUserRole(id: string, role: Role) {
  const user = await repo.update(id, { role });
  await invalidateUserCaches(id);
  return user;
}
