// ============================================
// NOTICE REPOSITORY — Pure Prisma Data Access
// ============================================

import { prisma } from "@/lib/prisma";
import { Role } from "../../app/generated/prisma/client";

// ---------- READS ----------

export async function findAll() {
  return prisma.notice.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      targetUser: { select: { id: true, name: true } },
      targetInstitution: { select: { id: true, name: true } },
    },
  });
}

export async function findById(id: string) {
  return prisma.notice.findUnique({
    where: { id },
    include: {
      targetUser: { select: { id: true, name: true } },
      targetInstitution: { select: { id: true, name: true } },
    },
  });
}

export async function getStats() {
  const [total, published, highPriority, urgent] = await Promise.all([
    prisma.notice.count(),
    prisma.notice.count({ where: { isPublished: true } }),
    prisma.notice.count({ where: { priority: "high" } }),
    prisma.notice.count({ where: { priority: "urgent" } }),
  ]);
  const draft = total - published;
  return { total, published, draft, highPriority, urgent };
}

// ---------- WRITES ----------

export async function create(data: {
  title: string;
  content: string;
  priority?: string;
  targetType?: string;
  targetRole?: Role;
  targetUserId?: string;
  targetInstitutionId?: string;
  isPublished?: boolean;
  publishedAt?: Date;
}) {
  return prisma.notice.create({ data });
}

export async function update(
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
  return prisma.notice.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.notice.delete({ where: { id } });
}
