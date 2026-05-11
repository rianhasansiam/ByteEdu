// ============================================
// REDIS CACHE KEY GENERATORS (Multi-Tenant)
// ============================================
//
// Naming convention: {panel}:{entity}:{scope}:{qualifier}
//
// - panel:     sa (superadmin), admin, teacher, student
// - entity:    users, institutions, dashboard, etc.
// - scope:     institutionId or userId (for tenant isolation)
// - qualifier: optional sub-key (e.g. "stats", specific ID)
//

export const CACHE_KEYS = {
  // ============================================
  // SuperAdmin (global scope — no tenant)
  // ============================================
  users: {
    all: () => "sa:users:all",
    byId: (id: string) => `sa:users:${id}`,
    stats: () => "sa:users:stats",
    institutions: () => "sa:users:institutions",
  },
  institutions: {
    all: () => "sa:institutions:all",
    byId: (id: string) => `sa:institutions:${id}`,
    stats: () => "sa:institutions:stats",
  },
  subscriptions: {
    all: () => "sa:subscriptions:all",
    byId: (id: string) => `sa:subscriptions:${id}`,
    stats: () => "sa:subscriptions:stats",
    availableInstitutions: () => "sa:subscriptions:available-institutions",
  },
  plans: {
    all: () => "sa:plans:all",
    byId: (id: string) => `sa:plans:${id}`,
  },
  notices: {
    all: () => "sa:notices:all",
    byId: (id: string) => `sa:notices:${id}`,
    stats: () => "sa:notices:stats",
  },
  dashboard: {
    superAdmin: () => "sa:dashboard:stats",
    recentActivity: () => "sa:dashboard:recent-activity",
  },

  // ============================================
  // Admin (scoped by institutionId)
  // ============================================
  admin: {
    dashboard: (instId: string) => `admin:${instId}:dashboard`,
    teachers: (instId: string) => `admin:${instId}:teachers`,
    students: (instId: string) => `admin:${instId}:students`,
    classes: (instId: string) => `admin:${instId}:classes`,
    sections: (instId: string) => `admin:${instId}:sections`,
    subjects: (instId: string) => `admin:${instId}:subjects`,
    attendance: (instId: string, date: string) =>
      `admin:${instId}:attendance:${date}`,
    notices: (instId: string) => `admin:${instId}:notices`,
    subscription: (instId: string) => `admin:${instId}:subscription`,
  },

  // ============================================
  // Teacher (scoped by userId)
  // ============================================
  teacher: {
    dashboard: (userId: string) => `teacher:${userId}:dashboard`,
    sections: (userId: string) => `teacher:${userId}:sections`,
    students: (userId: string, sectionId: string) =>
      `teacher:${userId}:students:${sectionId}`,
    attendance: (userId: string, sectionId: string, date: string) =>
      `teacher:${userId}:attendance:${sectionId}:${date}`,
  },

  // ============================================
  // Student (scoped by userId)
  // ============================================
  student: {
    dashboard: (userId: string) => `student:${userId}:dashboard`,
    attendance: (userId: string) => `student:${userId}:attendance`,
    results: (userId: string) => `student:${userId}:results`,
    assignments: (userId: string) => `student:${userId}:assignments`,
    notifications: (userId: string) => `student:${userId}:notifications`,
  },
} as const;

// ============================================
// INVALIDATION PATTERNS
// ============================================
//
// Used with invalidatePattern() for bulk cache clearing.
// These use Redis KEYS glob syntax.
//

export const INVALIDATION_PATTERNS = {
  /** All SuperAdmin cache */
  allSuperAdmin: () => "sa:*",
  /** All cache for a specific institution (admin panel) */
  allForInstitution: (instId: string) => `admin:${instId}:*`,
  /** All cache for a specific teacher */
  allForTeacher: (userId: string) => `teacher:${userId}:*`,
  /** All cache for a specific student */
  allForStudent: (userId: string) => `student:${userId}:*`,
} as const;
