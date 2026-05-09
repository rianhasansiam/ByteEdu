"use server";

import { prisma } from "@/lib/prisma";
import {
  getFromCache,
  setInCache,
  REDIS_KEYS,
} from "@/lib/redis";

// ============================================
// TYPES
// ============================================

export type DashboardStats = {
  totalUsers: number;
  totalAdmins: number;
  totalTeachers: number;
  totalStudents: number;
  totalInstitutions: number;
  activeInstitutions: number;
  totalSubscriptions: number;
  paidSubscriptions: number;
  dueSubscriptions: number;
  overdueSubscriptions: number;
  totalRevenue: number;
  paidAmount: number;
  dueAmount: number;
  totalNotices: number;
  publishedNotices: number;
};

export type RecentActivity = {
  id: string;
  type: "user_created" | "subscription_created" | "notice_published" | "institution_created";
  message: string;
  timestamp: Date;
  meta?: Record<string, string>;
};

// ============================================
// QUERIES
// ============================================

/**
 * Get comprehensive dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  // Try cache first
  const cached = await getFromCache<DashboardStats>(REDIS_KEYS.dashboardStats());
  if (cached) return cached;
  
  // Fetch all stats in parallel
  const [
    userStats,
    institutionStats,
    subscriptionStats,
    noticeStats,
  ] = await Promise.all([
    // User stats
    prisma.user.groupBy({
      by: ["role"],
      _count: { id: true },
    }),
    // Institution stats
    prisma.institution.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Subscription stats
    prisma.subscription.findMany({
      select: {
        paymentStatus: true,
        amount: true,
      },
    }),
    // Notice stats
    prisma.notice.groupBy({
      by: ["isPublished"],
      _count: { id: true },
    }),
  ]);
  
  // Calculate user counts
  let totalUsers = 0;
  let totalAdmins = 0;
  let totalTeachers = 0;
  let totalStudents = 0;
  
  for (const stat of userStats) {
    totalUsers += stat._count.id;
    switch (stat.role) {
      case "ADMIN":
        totalAdmins = stat._count.id;
        break;
      case "TEACHER":
        totalTeachers = stat._count.id;
        break;
      case "STUDENT":
        totalStudents = stat._count.id;
        break;
    }
  }
  
  // Calculate institution counts
  let totalInstitutions = 0;
  let activeInstitutions = 0;
  
  for (const stat of institutionStats) {
    totalInstitutions += stat._count.id;
    if (stat.status === "active") {
      activeInstitutions = stat._count.id;
    }
  }
  
  // Calculate subscription stats
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
  
  // Calculate notice counts
  let totalNotices = 0;
  let publishedNotices = 0;
  
  for (const stat of noticeStats) {
    totalNotices += stat._count.id;
    if (stat.isPublished) {
      publishedNotices = stat._count.id;
    }
  }
  
  const stats: DashboardStats = {
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
  
  // Cache for 5 minutes
  await setInCache(REDIS_KEYS.dashboardStats(), stats, 300);
  
  return stats;
}

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
  // Fetch recent records from each table
  const [recentUsers, recentSubscriptions, recentNotices, recentInstitutions] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        createdAt: true,
      },
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
      select: {
        id: true,
        title: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    }),
    prisma.institution.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);
  
  // Convert to unified activity format
  const activities: RecentActivity[] = [];
  
  for (const user of recentUsers) {
    activities.push({
      id: `user-${user.id}`,
      type: "user_created",
      message: `New ${user.role.toLowerCase().replace("_", " ")} "${user.name}" joined`,
      timestamp: user.createdAt,
      meta: { userId: user.id, role: user.role },
    });
  }
  
  for (const sub of recentSubscriptions) {
    activities.push({
      id: `sub-${sub.id}`,
      type: "subscription_created",
      message: `${sub.institution.name} subscribed to ${sub.plan.name}`,
      timestamp: sub.createdAt,
      meta: { subscriptionId: sub.id },
    });
  }
  
  for (const notice of recentNotices) {
    if (notice.publishedAt) {
      activities.push({
        id: `notice-${notice.id}`,
        type: "notice_published",
        message: `Notice "${notice.title}" was published`,
        timestamp: notice.publishedAt,
        meta: { noticeId: notice.id },
      });
    }
  }
  
  for (const inst of recentInstitutions) {
    activities.push({
      id: `inst-${inst.id}`,
      type: "institution_created",
      message: `Institution "${inst.name}" was registered`,
      timestamp: inst.createdAt,
      meta: { institutionId: inst.id },
    });
  }
  
  // Sort by timestamp descending and take limit
  activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  return activities.slice(0, limit);
}

/**
 * Get quick stats for a specific time period
 */
export async function getQuickStats(days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [newUsers, newSubscriptions, newInstitutions] = await Promise.all([
    prisma.user.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.subscription.count({
      where: { createdAt: { gte: startDate } },
    }),
    prisma.institution.count({
      where: { createdAt: { gte: startDate } },
    }),
  ]);
  
  return {
    newUsers,
    newSubscriptions,
    newInstitutions,
    period: `Last ${days} days`,
  };
}
