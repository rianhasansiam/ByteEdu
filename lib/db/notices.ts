"use server";

import { updateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache-tags";

// ============================================
// QUERIES (READ) - with cache tags
// ============================================

export const getAllNotices = unstable_cache(
  async () => {
    return prisma.notice.findMany({
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
  },
  ["all-notices"],
  { tags: [CACHE_TAGS.notices] }
);

export const getNoticeStats = unstable_cache(
  async () => {
    const [total, published, draft, highPriority, urgent] = await Promise.all([
      prisma.notice.count(),
      prisma.notice.count({ where: { isPublished: true } }),
      prisma.notice.count({ where: { isPublished: false } }),
      prisma.notice.count({ where: { priority: "high" } }),
      prisma.notice.count({ where: { priority: "urgent" } }),
    ]);
    return { total, published, draft, highPriority, urgent };
  },
  ["notice-stats"],
  { tags: [CACHE_TAGS.notices] }
);

export const searchInstitutions = unstable_cache(
  async (query: string) => {
    if (!query || query.length < 2) return [];
    return prisma.institution.findMany({
      where: {
        name: { contains: query, mode: "insensitive" },
      },
      select: { id: true, name: true, status: true },
      take: 10,
      orderBy: { name: "asc" },
    });
  },
  ["search-institutions"],
  { tags: [CACHE_TAGS.institutions] }
);

export const searchUsers = unstable_cache(
  async (query: string) => {
    if (!query || query.length < 2) return [];
    return prisma.user.findMany({
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
  },
  ["search-users"],
  { tags: [CACHE_TAGS.users] }
);

// ============================================
// MUTATIONS (WRITE) - with updateTag
// ============================================

export async function createNotice(data: {
  title: string;
  content: string;
  priority: string;
  targetType: string;
  targetRole?: Role;
  targetUserId?: string;
  targetInstitutionId?: string;
  isPublished: boolean;
}) {
  const notice = await prisma.notice.create({
    data: {
      title: data.title,
      content: data.content,
      priority: data.priority,
      targetType: data.targetType,
      targetRole: data.targetRole || null,
      targetUserId: data.targetUserId || null,
      targetInstitutionId: data.targetInstitutionId || null,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : null,
    },
  });

  updateTag(CACHE_TAGS.notices);
  return notice;
}

export async function updateNotice(
  id: string,
  data: {
    title?: string;
    content?: string;
    priority?: string;
    targetType?: string;
    targetRole?: Role | null;
    targetUserId?: string | null;
    targetInstitutionId?: string | null;
    isPublished?: boolean;
    publishedAt?: Date | null;
  }
) {
  const notice = await prisma.notice.update({
    where: { id },
    data,
  });

  updateTag(CACHE_TAGS.notices);
  return notice;
}

export async function deleteNotice(id: string) {
  await prisma.notice.delete({ where: { id } });
  updateTag(CACHE_TAGS.notices);
}

export async function toggleNoticePublish(id: string) {
  const notice = await prisma.notice.findUnique({ where: { id } });
  if (!notice) throw new Error("Notice not found");

  const newPublished = !notice.isPublished;
  const updated = await prisma.notice.update({
    where: { id },
    data: {
      isPublished: newPublished,
      publishedAt: newPublished ? new Date() : null,
    },
  });

  updateTag(CACHE_TAGS.notices);
  return updated;
}
