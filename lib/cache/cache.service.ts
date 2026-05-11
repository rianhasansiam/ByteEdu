import Redis from "ioredis";

// ============================================
// REDIS CLIENT SINGLETON
// ============================================

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.warn("[Cache] REDIS_URL not set — Redis caching disabled");
    return null;
  }

  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.error("[Cache] Redis error:", err.message);
    });

    return client;
  } catch (error) {
    console.error("[Cache] Failed to create Redis client:", error);
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

// ============================================
// DEFAULT TTL
// ============================================

const DEFAULT_TTL = 300; // 5 minutes

// ============================================
// READ-THROUGH CACHE
// ============================================

/**
 * Read-through cache helper.
 *
 * 1. Check Redis for cached value.
 * 2. On miss, call `fetcher()` to get fresh data from DB.
 * 3. Store the fresh data in Redis with TTL.
 * 4. Return the data.
 *
 * If Redis is unavailable, falls through to fetcher() directly.
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Try Redis first
  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit) {
        return JSON.parse(hit) as T;
      }
    } catch (error) {
      console.error(`[Cache] GET error for "${key}":`, error);
      // Fall through to fetcher
    }
  }

  // Cache miss — fetch fresh data
  const fresh = await fetcher();

  // Store in Redis (non-blocking, non-fatal)
  if (redis && fresh !== null && fresh !== undefined) {
    try {
      await redis.setex(key, ttl, JSON.stringify(fresh));
    } catch (error) {
      console.error(`[Cache] SET error for "${key}":`, error);
    }
  }

  return fresh;
}

// ============================================
// CACHE INVALIDATION
// ============================================

/**
 * Delete a single cache key from Redis.
 */
export async function invalidate(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Cache] DEL error for "${key}":`, error);
  }
}

/**
 * Delete all keys matching a glob pattern (e.g. "admin:inst123:*").
 *
 * Uses SCAN-based iteration which is production-safe — it never blocks
 * the Redis event loop, unlike the KEYS command.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== "0");
  } catch (error) {
    console.error(`[Cache] Pattern DEL error for "${pattern}":`, error);
  }
}

/**
 * Delete multiple specific keys at once.
 */
export async function invalidateMany(keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (error) {
    console.error(`[Cache] Multi-DEL error:`, error);
  }
}
