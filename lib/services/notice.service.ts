"use server";

// ============================================
// NOTICE SERVICE — Business Logic + Cache Orchestration
// ============================================

import * as repo from "@/lib/repositories/notice.repository";
import { cached, invalidate, invalidateMany } from "@/lib/cache/cache.service";
import { CACHE_KEYS } from "@/lib/cache/cache-keys";
import { TAGS, getNoticeRelatedTags, revalidateTags } from "@/lib/cache/cache-tags";
import { unstable_cache } from "next/cache";
import { Role } from "../../app/generated/prisma/client";

// ============================================
// READS
// ============================================

async function _getAllNotices() {
  return cached(CACHE_KEYS.notices.all(), () => repo.findAll());
}

export const getAllNotices = unstable_cache(
  _getAllNotices,
  ["all-notices"],
  { tags: [TAGS.notices] }
);

async function _getNoticeStats() {
  return cached(CACHE_KEYS.notices.stats(), () => repo.getStats());
}

export const getNoticeStats = unstable_cache(
  _getNoticeStats,
  ["notice-stats"],
  { tags: [TAGS.noticeStats] }
);

export async function getNoticeById(id: string) {
  return cached(CACHE_KEYS.notices.byId(id), () => repo.findById(id));
}

// ============================================
// MUTATIONS
// ============================================

async function invalidateNoticeCaches(institutionId?: string) {
  await invalidateMany([
    CACHE_KEYS.notices.all(),
    CACHE_KEYS.notices.stats(),
    CACHE_KEYS.dashboard.superAdmin(),
  ]);

  await revalidateTags(getNoticeRelatedTags(institutionId || undefined));
}

export async function createNotice(data: {
  title: string;
  content: string;
  priority?: string;
  targetType?: string;
  targetRole?: Role;
  targetUserId?: string;
  targetInstitutionId?: string;
  isPublished?: boolean;
}) {
  const noticeData = {
    ...data,
    publishedAt: data.isPublished ? new Date() : undefined,
  };

  const notice = await repo.create(noticeData);
  await invalidateNoticeCaches(data.targetInstitutionId);
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
  }
) {
  const updateData = {
    ...data,
    publishedAt: data.isPublished ? new Date() : null,
  };

  const notice = await repo.update(id, updateData);
  await invalidateNoticeCaches(data.targetInstitutionId || undefined);
  return notice;
}

export async function deleteNotice(id: string) {
  const existing = await repo.findById(id);
  if (!existing) throw new Error("Notice not found");

  await repo.remove(id);
  await invalidateNoticeCaches(existing.targetInstitutionId || undefined);
  return { success: true };
}
