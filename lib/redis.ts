import Redis from "ioredis";

// Create Redis client singleton
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisClient() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn("REDIS_URL not set, Redis caching disabled");
    return null;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
    });

    client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    client.on("connect", () => {
      console.log("Redis connected successfully");
    });

    return client;
  } catch (error) {
    console.error("Failed to create Redis client:", error);
    return null;
  }
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}

// Cache helper functions
const DEFAULT_TTL = 60 * 5; // 5 minutes

export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  
  try {
    const cached = await redis.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    console.error(`Redis GET error for key ${key}:`, error);
    return null;
  }
}

export async function setInCache<T>(
  key: string, 
  value: T, 
  ttl: number = DEFAULT_TTL
): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error(`Redis SET error for key ${key}:`, error);
  }
}

export async function deleteFromCache(key: string): Promise<void> {
  if (!redis) return;
  
  try {
    await redis.del(key);
  } catch (error) {
    console.error(`Redis DEL error for key ${key}:`, error);
  }
}

export async function invalidateCachePattern(pattern: string): Promise<void> {
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
    console.error(`Redis pattern invalidation error for ${pattern}:`, error);
  }
}

// Cache key generators
export const REDIS_KEYS = {
  // Users
  users: () => "superadmin:users",
  userStats: () => "superadmin:user-stats",
  userInstitutions: () => "superadmin:user-institutions",
  userById: (id: string) => `superadmin:user:${id}`,
  
  // Institutions
  institutions: () => "superadmin:institutions",
  institutionStats: () => "superadmin:institution-stats",
  institutionById: (id: string) => `superadmin:institution:${id}`,
  
  // Subscriptions
  subscriptions: () => "superadmin:subscriptions",
  subscriptionStats: () => "superadmin:subscription-stats",
  subscriptionById: (id: string) => `superadmin:subscription:${id}`,
  
  // Plans
  plans: () => "superadmin:plans",
  planById: (id: string) => `superadmin:plan:${id}`,
  
  // Notices
  notices: () => "superadmin:notices",
  noticeStats: () => "superadmin:notice-stats",
  noticeById: (id: string) => `superadmin:notice:${id}`,
  
  // Transactions
  transactions: () => "superadmin:transactions",
  transactionStats: () => "superadmin:transaction-stats",
  
  // Dashboard
  dashboardStats: () => "superadmin:dashboard-stats",
} as const;

// Invalidation helpers
export async function invalidateUserCache() {
  await Promise.all([
    invalidateCachePattern("superadmin:user*"),
    deleteFromCache(REDIS_KEYS.dashboardStats()),
  ]);
}

export async function invalidateInstitutionCache() {
  await Promise.all([
    invalidateCachePattern("superadmin:institution*"),
    deleteFromCache(REDIS_KEYS.userInstitutions()),
    deleteFromCache(REDIS_KEYS.dashboardStats()),
  ]);
}

export async function invalidateSubscriptionCache() {
  await Promise.all([
    invalidateCachePattern("superadmin:subscription*"),
    deleteFromCache(REDIS_KEYS.dashboardStats()),
  ]);
}

export async function invalidatePlanCache() {
  await invalidateCachePattern("superadmin:plan*");
}

export async function invalidateNoticeCache() {
  await Promise.all([
    invalidateCachePattern("superadmin:notice*"),
    deleteFromCache(REDIS_KEYS.dashboardStats()),
  ]);
}
