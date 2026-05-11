/**
 * Redis-based sliding window rate limiter.
 * Falls back to in-memory Map when Redis is unavailable.
 * 
 * Usage:
 *   import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
 *   
 *   const result = await checkRateLimit(ip, RATE_LIMITS.AUTH);
 *   if (!result.allowed) {
 *     return NextResponse.json(
 *       { error: "Too many requests" }, 
 *       { status: 429, headers: { "Retry-After": String(result.retryAfter) } }
 *     );
 *   }
 */

import { redis } from "@/lib/redis";

export interface RateLimitConfig {
  /** Time window in seconds */
  windowSeconds: number;
  /** Max requests allowed within the window */
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

/** Pre-configured rate limit profiles */
export const RATE_LIMITS = {
  /** Auth endpoints: 5 requests per 60 seconds */
  AUTH: { windowSeconds: 60, maxRequests: 5 } as RateLimitConfig,
  /** Signup endpoints: 3 requests per 60 seconds */
  SIGNUP: { windowSeconds: 60, maxRequests: 3 } as RateLimitConfig,
  /** General API: 30 requests per 60 seconds */
  API: { windowSeconds: 60, maxRequests: 30 } as RateLimitConfig,
} as const;

// In-memory fallback when Redis is unavailable
const memoryStore = new Map<string, { count: number; resetAt: number }>();

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, value] of memoryStore) {
    if (value.resetAt <= now) {
      memoryStore.delete(key);
    }
  }
}

// Periodic cleanup every 60s
if (typeof setInterval !== "undefined") {
  setInterval(cleanupMemoryStore, 60_000);
}

async function checkRateLimitRedis(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis) {
    return checkRateLimitMemory(key, config);
  }

  try {
    const redisKey = `ratelimit:${key}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - config.windowSeconds;

    // Use a pipeline for atomicity
    const pipeline = redis.pipeline();
    // Remove expired entries
    pipeline.zremrangebyscore(redisKey, 0, windowStart);
    // Add current request
    pipeline.zadd(redisKey, now, `${now}:${Math.random()}`);
    // Count requests in window
    pipeline.zcard(redisKey);
    // Set expiry on the key
    pipeline.expire(redisKey, config.windowSeconds);

    const results = await pipeline.exec();
    if (!results) {
      return checkRateLimitMemory(key, config);
    }

    const count = (results[2]?.[1] as number) || 0;
    const allowed = count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count);
    const retryAfter = allowed ? 0 : config.windowSeconds;

    return { allowed, remaining, retryAfter };
  } catch {
    // Fallback to memory on Redis error
    return checkRateLimitMemory(key, config);
  }
}

function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      retryAfter: 0,
    };
  }

  entry.count++;
  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const retryAfter = allowed
    ? 0
    : Math.ceil((entry.resetAt - now) / 1000);

  return { allowed, remaining, retryAfter };
}

/**
 * Check rate limit for a given identifier (typically IP address).
 * 
 * @param identifier - Unique key (e.g., IP address or `route:ip`)
 * @param config - Rate limit configuration
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimitRedis(identifier, config);
}

/**
 * Extract client IP from request headers.
 * Works with Vercel, Cloudflare, and standard proxies.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown";
}
