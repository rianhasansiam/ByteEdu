// ============================================
// POST-MUTATION CACHE INVALIDATION FOR USER CHANGES
// ============================================
//
// Call this after ANY user creation/update/delete to ensure
// every cache layer (Redis + Next.js) is immediately updated.
// The existing <Hydrate> pattern will automatically push
// fresh data into Redux on the next page render.
//
// SAFETY: This function never throws. If Redis or revalidateTag
// fails, the error is logged but user creation is NOT affected.
//

import { invalidateMany } from "@/lib/cache/cache.service";
import { CACHE_KEYS } from "@/lib/cache/cache-keys";
import { getUserRelatedTags, revalidateTags, TAGS } from "@/lib/cache/cache-tags";

interface InvalidationOptions {
  userId?: string;
  institutionId?: string | null;
  /** The role of the created/modified user — drives role-specific cache busting */
  role?: string;
}

/**
 * Invalidate all relevant caches after a user mutation (create, update, delete).
 *
 * Clears:
 * 1. Redis keys — SuperAdmin user lists, dashboard stats, and institution-scoped keys
 *    (uses exact key deletion only — no KEYS or SCAN commands)
 * 2. Next.js cache tags — triggers on-demand revalidation so the next server render
 *    fetches fresh data from the DB (and <Hydrate> pushes it into Redux automatically)
 *
 * This function is internally safe — it never throws. Cache failures are
 * logged but do not affect the caller's mutation flow.
 */
export async function invalidateAfterUserMutation(
  opts: InvalidationOptions = {}
): Promise<void> {
  const { userId, institutionId, role } = opts;

  try {
    // --------------------------------------------------
    // 1. Invalidate Redis cache keys (exact keys only)
    // --------------------------------------------------
    const redisKeys: string[] = [
      // SuperAdmin global caches
      CACHE_KEYS.users.all(),
      CACHE_KEYS.users.stats(),
      CACHE_KEYS.users.institutions(),
      CACHE_KEYS.dashboard.superAdmin(),
    ];

    // User-specific cache
    if (userId) {
      redisKeys.push(CACHE_KEYS.users.byId(userId));
    }

    // Institution-scoped caches (exact keys, no wildcards)
    if (institutionId) {
      redisKeys.push(
        CACHE_KEYS.admin.dashboard(institutionId),
        CACHE_KEYS.admin.teachers(institutionId),
        CACHE_KEYS.admin.students(institutionId),
        CACHE_KEYS.admin.classes(institutionId),
        CACHE_KEYS.admin.sections(institutionId),
      );
    }

    // Use Promise.allSettled so individual Redis failures don't cascade
    const redisResults = await Promise.allSettled([
      invalidateMany(redisKeys),
    ]);

    // Log any Redis failures
    for (const result of redisResults) {
      if (result.status === "rejected") {
        console.error("[invalidateAfterUserMutation] Redis invalidation failed:", result.reason);
      }
    }

    // --------------------------------------------------
    // 2. Revalidate Next.js cache tags (immediate)
    // --------------------------------------------------
    const tags: string[] = getUserRelatedTags(userId);

    if (institutionId) {
      tags.push(TAGS.adminDashboard(institutionId));
      if (role === "TEACHER") tags.push(TAGS.adminTeachers(institutionId));
      if (role === "STUDENT") tags.push(TAGS.adminStudents(institutionId));
      if (role === "ADMIN") tags.push(TAGS.adminDashboard(institutionId));
    }

    await revalidateTags(tags);
  } catch (error) {
    // CRITICAL: Never let cache invalidation failures propagate
    // to the caller. The DB mutation already succeeded.
    console.error("[invalidateAfterUserMutation] Cache invalidation failed:", error);
  }
}
