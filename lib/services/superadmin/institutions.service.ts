"use server";

import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateTag } from "next/cache";
import {
  getFromCache,
  setInCache,
  invalidateInstitutionCache,
  REDIS_KEYS,
} from "@/lib/redis";

// ============================================
// TYPES
// ============================================

export type InstitutionFilters = {
  search?: string;
  status?: "active" | "inactive" | "ALL";
  sortBy?: "name" | "users" | "latest";
};

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

export type CreateInstitutionInput = {
  name: string;
  status?: "active" | "inactive";
};

export type UpdateInstitutionInput = {
  name?: string;
  status?: "active" | "inactive";
};

// ============================================
// QUERIES
// ============================================

/**
 * Get all institutions with users and computed stats
 */
export async function getInstitutions(filters: InstitutionFilters = {}) {
  const { search, status, sortBy = "name" } = filters;
  
  // Try cache for unfiltered requests
  const isUnfiltered = !search && (!status || status === "ALL");
  if (isUnfiltered) {
    const cached = await getFromCache<InstitutionData[]>(REDIS_KEYS.institutions());
    if (cached) {
      return sortInstitutions(cached, sortBy);
    }
  }
  
  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  
  if (status && status !== "ALL") {
    where.status = status;
  }
  
  // Fetch institutions with users
  const institutions = await prisma.institution.findMany({
    where,
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
  
  // Transform data with computed stats
  const result: InstitutionData[] = institutions.map((inst) => {
    const admins = inst.users.filter((u) => u.role === "ADMIN").length;
    const teachers = inst.users.filter((u) => u.role === "TEACHER").length;
    const students = inst.users.filter((u) => u.role === "STUDENT").length;
    const others = inst.users.length - admins - teachers - students;
    
    const latestJoin = inst.users.length > 0
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
      users: inst.users.map((u) => ({
        ...u,
        institution: inst.name,
      })),
      createdAt: inst.createdAt,
    };
  });
  
  // Cache unfiltered results
  if (isUnfiltered) {
    await setInCache(REDIS_KEYS.institutions(), result, 300);
  }
  
  return sortInstitutions(result, sortBy);
}

function sortInstitutions(institutions: InstitutionData[], sortBy: string) {
  const sorted = [...institutions];
  
  switch (sortBy) {
    case "users":
      sorted.sort((a, b) => b.totalUsers - a.totalUsers);
      break;
    case "latest":
      sorted.sort(
        (a, b) => new Date(b.latestJoin).getTime() - new Date(a.latestJoin).getTime()
      );
      break;
    case "name":
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  
  return sorted;
}

/**
 * Get institution by ID
 */
export async function getInstitutionById(id: string) {
  const cached = await getFromCache<InstitutionData>(REDIS_KEYS.institutionById(id));
  if (cached) return cached;
  
  const inst = await prisma.institution.findUnique({
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
    },
  });
  
  if (!inst) return null;
  
  const admins = inst.users.filter((u) => u.role === "ADMIN").length;
  const teachers = inst.users.filter((u) => u.role === "TEACHER").length;
  const students = inst.users.filter((u) => u.role === "STUDENT").length;
  const others = inst.users.length - admins - teachers - students;
  
  const result: InstitutionData = {
    id: inst.id,
    name: inst.name,
    status: inst.status as "active" | "inactive",
    totalUsers: inst.users.length,
    admins,
    teachers,
    students,
    others,
    latestJoin: inst.users[0]?.createdAt || inst.createdAt,
    users: inst.users,
    createdAt: inst.createdAt,
  };
  
  await setInCache(REDIS_KEYS.institutionById(id), result, 300);
  return result;
}

/**
 * Get institution statistics
 */
export async function getInstitutionStats(): Promise<InstitutionStats> {
  const cached = await getFromCache<InstitutionStats>(REDIS_KEYS.institutionStats());
  if (cached) return cached;
  
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
  
  const stats: InstitutionStats = {
    total: institutions.length,
    active,
    inactive,
    totalUsers,
  };
  
  await setInCache(REDIS_KEYS.institutionStats(), stats, 300);
  return stats;
}

/**
 * Get simple institution list for dropdowns
 */
export async function getInstitutionList() {
  const institutions = await prisma.institution.findMany({
    select: { id: true, name: true, status: true },
    orderBy: { name: "asc" },
  });
  return institutions;
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new institution
 */
export async function createInstitution(data: CreateInstitutionInput) {
  // Check for duplicate name
  const existing = await prisma.institution.findUnique({
    where: { name: data.name },
  });
  if (existing) {
    throw new Error("An institution with this name already exists");
  }
  
  const institution = await prisma.institution.create({
    data: {
      name: data.name,
      status: data.status || "active",
    },
  });
  
  // Invalidate caches
  await invalidateInstitutionCache();
  revalidateTag(CACHE_TAGS.institutions, { expire: 0 });
  
  return institution;
}

/**
 * Update an institution
 */
export async function updateInstitution(id: string, data: UpdateInstitutionInput) {
  const existing = await prisma.institution.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Institution not found");
  }
  
  // Check name uniqueness if name is being changed
  if (data.name && data.name !== existing.name) {
    const nameExists = await prisma.institution.findUnique({
      where: { name: data.name },
    });
    if (nameExists) {
      throw new Error("An institution with this name already exists");
    }
  }
  
  const institution = await prisma.institution.update({
    where: { id },
    data: {
      name: data.name,
      status: data.status,
    },
  });
  
  // Invalidate caches
  await invalidateInstitutionCache();
  revalidateTag(CACHE_TAGS.institutions, { expire: 0 });
  revalidateTag(CACHE_TAGS.users, { expire: 0 }); // Users have institution relation
  
  return institution;
}

/**
 * Toggle institution status (active/inactive)
 */
export async function toggleInstitutionStatus(id: string) {
  const existing = await prisma.institution.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Institution not found");
  }
  
  const newStatus = existing.status === "active" ? "inactive" : "active";
  
  const institution = await prisma.institution.update({
    where: { id },
    data: { status: newStatus },
  });
  
  // Invalidate caches
  await invalidateInstitutionCache();
  revalidateTag(CACHE_TAGS.institutions, { expire: 0 });
  
  return institution;
}

/**
 * Delete an institution
 */
export async function deleteInstitution(id: string) {
  const existing = await prisma.institution.findUnique({
    where: { id },
    include: { _count: { select: { users: true, subscriptions: true } } },
  });
  
  if (!existing) {
    throw new Error("Institution not found");
  }
  
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
  
  await prisma.institution.delete({ where: { id } });
  
  // Invalidate caches
  await invalidateInstitutionCache();
  revalidateTag(CACHE_TAGS.institutions, { expire: 0 });
  
  return { success: true };
}
