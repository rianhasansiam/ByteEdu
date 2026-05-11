// ============================================
// DASHBOARD REPOSITORY — Pure Prisma Data Access
// ============================================

import { prisma } from "@/lib/prisma";

// ---------- SuperAdmin Dashboard ----------

export async function getSuperAdminStats() {
  const [userStats, institutionStats, subscriptionStats, noticeStats] =
    await Promise.all([
      prisma.user.groupBy({
        by: ["role"],
        _count: { id: true },
      }),
      prisma.institution.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.subscription.findMany({
        select: { paymentStatus: true, amount: true },
      }),
      prisma.notice.groupBy({
        by: ["isPublished"],
        _count: { id: true },
      }),
    ]);

  // User counts
  let totalUsers = 0;
  let totalAdmins = 0;
  let totalTeachers = 0;
  let totalStudents = 0;
  for (const stat of userStats) {
    totalUsers += stat._count.id;
    if (stat.role === "ADMIN") totalAdmins = stat._count.id;
    if (stat.role === "TEACHER") totalTeachers = stat._count.id;
    if (stat.role === "STUDENT") totalStudents = stat._count.id;
  }

  // Institution counts
  let totalInstitutions = 0;
  let activeInstitutions = 0;
  for (const stat of institutionStats) {
    totalInstitutions += stat._count.id;
    if (stat.status === "active") activeInstitutions = stat._count.id;
  }

  // Subscription stats
  let totalSubscriptions = subscriptionStats.length;
  let paidSubscriptions = 0;
  let dueSubscriptions = 0;
  let overdueSubscriptions = 0;
  let totalRevenue = 0;
  let paidAmount = 0;
  let dueAmount = 0;
  for (const sub of subscriptionStats) {
    totalRevenue += sub.amount;
    switch (sub.paymentStatus) {
      case "paid":
        paidSubscriptions++;
        paidAmount += sub.amount;
        break;
      case "due":
        dueSubscriptions++;
        dueAmount += sub.amount;
        break;
      case "overdue":
        overdueSubscriptions++;
        dueAmount += sub.amount;
        break;
    }
  }

  // Notice counts
  let totalNotices = 0;
  let publishedNotices = 0;
  for (const stat of noticeStats) {
    totalNotices += stat._count.id;
    if (stat.isPublished) publishedNotices = stat._count.id;
  }

  return {
    totalUsers,
    totalAdmins,
    totalTeachers,
    totalStudents,
    totalInstitutions,
    activeInstitutions,
    totalSubscriptions,
    paidSubscriptions,
    dueSubscriptions,
    overdueSubscriptions,
    totalRevenue,
    paidAmount,
    dueAmount,
    totalNotices,
    publishedNotices,
  };
}

export async function getRecentActivity(limit: number = 10) {
  const [recentUsers, recentSubscriptions, recentNotices, recentInstitutions] =
    await Promise.all([
      prisma.user.findMany({
        select: { id: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.subscription.findMany({
        select: {
          id: true,
          institution: { select: { name: true } },
          plan: { select: { name: true } },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notice.findMany({
        where: { isPublished: true },
        select: { id: true, title: true, publishedAt: true },
        orderBy: { publishedAt: "desc" },
        take: limit,
      }),
      prisma.institution.findMany({
        select: { id: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
    ]);

  return { recentUsers, recentSubscriptions, recentNotices, recentInstitutions };
}
