"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateTag } from "next/cache";
import {
  getFromCache,
  setInCache,
  invalidateNoticeCache,
  REDIS_KEYS,
} from "@/lib/redis";

// ============================================
// TYPES
// ============================================

export type NoticeFilters = {
  search?: string;
  priority?: "low" | "normal" | "high" | "urgent" | "ALL";
  targetType?: "all" | "role" | "user" | "institution" | "ALL";
  targetRole?: Role;
  status?: "published" | "draft" | "ALL";
};

export type NoticeRecord = {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetType: string;
  targetRole: Role | null;
  targetUserId: string | null;
  targetUser: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  targetInstitutionId: string | null;
  targetInstitution: {
    id: string;
    name: string;
  } | null;
  isPublished: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type NoticeStats = {
  total: number;
  published: number;
  draft: number;
  highPriority: number;
  urgent: number;
};

export type CreateNoticeInput = {
  title: string;
  content: string;
  priority: "low" | "normal" | "high" | "urgent";
  targetType: "all" | "role" | "user" | "institution";
  targetRole?: Role;
  targetUserId?: string;
  targetInstitutionId?: string;
  isPublished?: boolean;
};

export type UpdateNoticeInput = {
  title?: string;
  content?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  targetType?: "all" | "role" | "user" | "institution";
  targetRole?: Role | null;
  targetUserId?: string | null;
  targetInstitutionId?: string | null;
  isPublished?: boolean;
};

// ============================================
// QUERIES
// ============================================

/**
 * Get all notices with optional filtering
 */
export async function getNotices(filters: NoticeFilters = {}) {
  const { search, priority, targetType, targetRole, status } = filters;
  
  // Try cache for unfiltered requests
  const isUnfiltered =
    !search &&
    (!priority || priority === "ALL") &&
    (!targetType || targetType === "ALL") &&
    (!status || status === "ALL");
    
  if (isUnfiltered) {
    const cached = await getFromCache<NoticeRecord[]>(REDIS_KEYS.notices());
    if (cached) return cached;
  }
  
  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (priority && priority !== "ALL") {
    where.priority = priority;
  }
  
  if (targetType && targetType !== "ALL") {
    where.targetType = targetType;
    if (targetType === "role" && targetRole) {
      where.targetRole = targetRole;
    }
  }
  
  if (status && status !== "ALL") {
    where.isPublished = status === "published";
  }
  
  const notices = await prisma.notice.findMany({
    where,
    include: {
      targetUser: {
        select: { id: true, name: true, email: true, role: true },
      },
      targetInstitution: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  // Cache unfiltered results
  if (isUnfiltered) {
    await setInCache(REDIS_KEYS.notices(), notices, 300);
  }
  
  return notices;
}

/**
 * Get notice by ID
 */
export async function getNoticeById(id: string) {
  const cached = await getFromCache<NoticeRecord>(REDIS_KEYS.noticeById(id));
  if (cached) return cached;
  
  const notice = await prisma.notice.findUnique({
    where: { id },
    include: {
      targetUser: {
        select: { id: true, name: true, email: true, role: true },
      },
      targetInstitution: {
        select: { id: true, name: true },
      },
    },
  });
  
  if (notice) {
    await setInCache(REDIS_KEYS.noticeById(id), notice, 300);
  }
  
  return notice;
}

/**
 * Get notice statistics
 */
export async function getNoticeStats(): Promise<NoticeStats> {
  const cached = await getFromCache<NoticeStats>(REDIS_KEYS.noticeStats());
  if (cached) return cached;
  
  const [total, published, draft, highPriority, urgent] = await Promise.all([
    prisma.notice.count(),
    prisma.notice.count({ where: { isPublished: true } }),
    prisma.notice.count({ where: { isPublished: false } }),
    prisma.notice.count({ where: { priority: "high" } }),
    prisma.notice.count({ where: { priority: "urgent" } }),
  ]);
  
  const stats: NoticeStats = { total, published, draft, highPriority, urgent };
  await setInCache(REDIS_KEYS.noticeStats(), stats, 300);
  
  return stats;
}

/**
 * Search institutions for notice targeting
 */
export async function searchInstitutions(query: string) {
  if (!query || query.length < 2) return [];
  
  const institutions = await prisma.institution.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
    },
    select: { id: true, name: true, status: true },
    take: 10,
    orderBy: { name: "asc" },
  });
  
  return institutions;
}

/**
 * Search users for notice targeting
 */
export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];
  
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, role: true },
    take: 10,
    orderBy: { name: "asc" },
  });
  
  return users;
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new notice
 */
export async function createNotice(data: CreateNoticeInput) {
  // Validate target based on targetType
  if (data.targetType === "user" && !data.targetUserId) {
    throw new Error("Target user is required for user-targeted notices");
  }
  if (data.targetType === "institution" && !data.targetInstitutionId) {
    throw new Error("Target institution is required for institution-targeted notices");
  }
  if (data.targetType === "role" && !data.targetRole) {
    throw new Error("Target role is required for role-targeted notices");
  }
  
  // Verify target exists
  if (data.targetUserId) {
    const user = await prisma.user.findUnique({ where: { id: data.targetUserId } });
    if (!user) throw new Error("Target user not found");
  }
  if (data.targetInstitutionId) {
    const inst = await prisma.institution.findUnique({ where: { id: data.targetInstitutionId } });
    if (!inst) throw new Error("Target institution not found");
  }
  
  const notice = await prisma.notice.create({
    data: {
      title: data.title,
      content: data.content,
      priority: data.priority,
      targetType: data.targetType,
      targetRole: data.targetType === "role" ? data.targetRole : null,
      targetUserId: data.targetType === "user" ? data.targetUserId : null,
      targetInstitutionId: data.targetType === "institution" ? data.targetInstitutionId : null,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? new Date() : null,
    },
    include: {
      targetUser: {
        select: { id: true, name: true, email: true, role: true },
      },
      targetInstitution: {
        select: { id: true, name: true },
      },
    },
  });
  
  // Invalidate caches
  await invalidateNoticeCache();
  revalidateTag(CACHE_TAGS.notices, "max");
  
  return notice;
}

/**
 * Update a notice
 */
export async function updateNotice(id: string, data: UpdateNoticeInput) {
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Notice not found");
  }
  
  // Handle publishedAt when publishing
  const publishedAt =
    data.isPublished === true && !existing.isPublished
      ? new Date()
      : data.isPublished === false
      ? null
      : existing.publishedAt;
  
  const notice = await prisma.notice.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
      priority: data.priority,
      targetType: data.targetType,
      targetRole: data.targetRole,
      targetUserId: data.targetUserId,
      targetInstitutionId: data.targetInstitutionId,
      isPublished: data.isPublished,
      publishedAt,
    },
    include: {
      targetUser: {
        select: { id: true, name: true, email: true, role: true },
      },
      targetInstitution: {
        select: { id: true, name: true },
      },
    },
  });
  
  // Invalidate caches
  await invalidateNoticeCache();
  revalidateTag(CACHE_TAGS.notices, "max");
  
  return notice;
}

/**
 * Toggle notice publish status
 */
export async function toggleNoticePublish(id: string) {
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Notice not found");
  }
  
  const newPublished = !existing.isPublished;
  
  const notice = await prisma.notice.update({
    where: { id },
    data: {
      isPublished: newPublished,
      publishedAt: newPublished ? new Date() : null,
    },
  });
  
  // Invalidate caches
  await invalidateNoticeCache();
  revalidateTag(CACHE_TAGS.notices, "max");
  
  return notice;
}

/**
 * Delete a notice
 */
export async function deleteNotice(id: string) {
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Notice not found");
  }
  
  await prisma.notice.delete({ where: { id } });
  
  // Invalidate caches
  await invalidateNoticeCache();
  revalidateTag(CACHE_TAGS.notices, "max");
  
  return { success: true };
}
