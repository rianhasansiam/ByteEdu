// Centralized cache tags for the entire project
// Use these constants to ensure consistency when caching and revalidating

export const CACHE_TAGS = {
  // Users
  users: "users",
  userStats: "users-stats",
  userInstitutions: "users-institutions",
  userById: (id: string) => `user-${id}`,
  userByEmail: (email: string) => `user-email-${email}`,

  // Institutions
  institutions: "institutions",
  institutionById: (id: string) => `institution-${id}`,

  // Subscriptions
  subscriptions: "subscriptions",
  subscriptionById: (id: string) => `subscription-${id}`,

  // Transactions
  transactions: "transactions",
  transactionById: (id: string) => `transaction-${id}`,

  // Notices
  notices: "notices",
  noticeById: (id: string) => `notice-${id}`,

  // Classes
  classes: "classes",
  classById: (id: string) => `class-${id}`,

  // Sections
  sections: "sections",
  sectionById: (id: string) => `section-${id}`,

  // Subjects
  subjects: "subjects",
  subjectById: (id: string) => `subject-${id}`,

  // Attendance
  attendance: "attendance",
  attendanceById: (id: string) => `attendance-${id}`,

  // Results
  results: "results",
  resultById: (id: string) => `result-${id}`,

  // Fees
  fees: "fees",
  feeById: (id: string) => `fee-${id}`,

  // Inventory
  inventory: "inventory",
  inventoryById: (id: string) => `inventory-${id}`,

  // Documents
  documents: "documents",
  documentById: (id: string) => `document-${id}`,
} as const;

// Helper to get all tags that should be invalidated when users change
export const getUserRelatedTags = (userId?: string): string[] => {
  const tags: string[] = [CACHE_TAGS.users, CACHE_TAGS.userStats, CACHE_TAGS.userInstitutions];
  if (userId) {
    tags.push(CACHE_TAGS.userById(userId));
  }
  return tags;
};
