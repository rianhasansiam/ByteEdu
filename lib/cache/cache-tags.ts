// ============================================
// NEXT.JS CACHE TAGS (On-Demand Revalidation)
// ============================================
//
// These tags are used with `unstable_cache({ tags: [...] })` for reads
// and `revalidateTag()` for invalidation after mutations.
//
// Convention: {entity} or {entity}:{scope}
//

export const TAGS = {
  // ============================================
  // Global entities (SuperAdmin)
  // ============================================
  users: "users",
  userStats: "user-stats",
  userInstitutions: "user-institutions",
  institutions: "institutions",
  institutionStats: "institution-stats",
  subscriptions: "subscriptions",
  subscriptionStats: "subscription-stats",
  plans: "plans",
  notices: "notices",
  noticeStats: "notice-stats",
  superAdminDashboard: "sa-dashboard",
  transactions: "transactions",

  // ============================================
  // Tenant-scoped (Admin panel)
  // ============================================
  adminDashboard: (instId: string) => `admin-dashboard:${instId}` as const,
  adminClasses: (instId: string) => `admin-classes:${instId}` as const,
  adminSections: (instId: string) => `admin-sections:${instId}` as const,
  adminSubjects: (instId: string) => `admin-subjects:${instId}` as const,
  adminTeachers: (instId: string) => `admin-teachers:${instId}` as const,
  adminStudents: (instId: string) => `admin-students:${instId}` as const,
  adminAttendance: (instId: string) => `admin-attendance:${instId}` as const,
  adminNotices: (instId: string) => `admin-notices:${instId}` as const,

  // ============================================
  // User-scoped (Teacher / Student panels)
  // ============================================
  teacherDashboard: (userId: string) => `teacher-dashboard:${userId}` as const,
  teacherSections: (userId: string) => `teacher-sections:${userId}` as const,
  studentDashboard: (userId: string) => `student-dashboard:${userId}` as const,
} as const;

// ============================================
// TAG GROUP HELPERS (for bulk invalidation)
// ============================================

/** Tags to invalidate when user data changes */
export function getUserRelatedTags(userId?: string): string[] {
  const tags: string[] = [
    TAGS.users,
    TAGS.userStats,
    TAGS.userInstitutions,
    TAGS.superAdminDashboard,
  ];
  return tags;
}

/** Tags to invalidate when institution data changes */
export function getInstitutionRelatedTags(instId?: string): string[] {
  const tags: string[] = [
    TAGS.institutions,
    TAGS.institutionStats,
    TAGS.superAdminDashboard,
  ];
  if (instId) {
    tags.push(TAGS.adminDashboard(instId));
  }
  return tags;
}

/** Tags to invalidate when subscription data changes */
export function getSubscriptionRelatedTags(): string[] {
  return [
    TAGS.subscriptions,
    TAGS.subscriptionStats,
    TAGS.superAdminDashboard,
  ];
}

/** Tags to invalidate when notice data changes */
export function getNoticeRelatedTags(instId?: string): string[] {
  const tags: string[] = [
    TAGS.notices,
    TAGS.noticeStats,
  ];
  if (instId) {
    tags.push(TAGS.adminNotices(instId));
  }
  return tags;
}

/** Tags to invalidate when attendance data changes */
export function getAttendanceRelatedTags(
  instId: string,
  teacherId?: string,
  studentId?: string
): string[] {
  const tags: string[] = [TAGS.adminAttendance(instId)];
  if (teacherId) tags.push(TAGS.teacherDashboard(teacherId));
  if (studentId) tags.push(TAGS.studentDashboard(studentId));
  return tags;
}

/** Bulk revalidate an array of tags */
export async function revalidateTags(tags: string[]): Promise<void> {
  // Dynamic import to avoid issues in non-server contexts
  const { revalidateTag } = await import("next/cache");
  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
}
