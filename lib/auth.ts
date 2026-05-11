import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import bcrypt from "bcryptjs";

/** Session cache TTL in seconds */
const SESSION_CACHE_TTL = 30;

/** Build a Redis key for cached session user data */
function sessionCacheKey(userId: string): string {
  return `session:user:${userId}`;
}

interface CachedSessionUser {
  role: string;
  institutionId: string | null;
  institutionName: string | null;
}

/**
 * Invalidate cached session data for a user.
 * Call this when a user's role, institution, or status changes.
 */
export async function invalidateSessionCache(userId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(sessionCacheKey(userId));
  } catch {
    // Silently fail — session will refresh from DB on next request
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: {
            institution: true,
          },
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          picture: user.picture,
          institutionId: user.institutionId,
          institutionName: user.institution?.name,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.picture = (user as unknown as { picture?: string | null }).picture;
        token.institutionId = (user as unknown as { institutionId?: string | null }).institutionId;
        token.institutionName = (user as unknown as { institutionName?: string | null }).institutionName;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.picture = token.picture as string | null | undefined;

        const userId = token.id as string;

        // Try Redis cache first for session user data
        let cachedUser: CachedSessionUser | null = null;

        if (redis) {
          try {
            const cached = await redis.get(sessionCacheKey(userId));
            if (cached) {
              cachedUser = JSON.parse(cached) as CachedSessionUser;
            }
          } catch {
            // Redis unavailable — fall through to DB
          }
        }

        if (cachedUser) {
          // Use cached data
          session.user.role = cachedUser.role;
          session.user.institutionId = cachedUser.institutionId;
          session.user.institutionName = cachedUser.institutionName;
        } else {
          // Refresh from DB and cache the result
          try {
            const freshUser = await prisma.user.findUnique({
              where: { id: userId },
              select: { role: true, institutionId: true, institution: { select: { name: true } } },
            });
            if (freshUser) {
              session.user.role = freshUser.role;
              session.user.institutionId = freshUser.institutionId;
              session.user.institutionName = freshUser.institution?.name || null;

              // Cache in Redis with short TTL
              if (redis) {
                try {
                  const toCache: CachedSessionUser = {
                    role: freshUser.role,
                    institutionId: freshUser.institutionId,
                    institutionName: freshUser.institution?.name || null,
                  };
                  await redis.setex(
                    sessionCacheKey(userId),
                    SESSION_CACHE_TTL,
                    JSON.stringify(toCache)
                  );
                } catch {
                  // Cache write failure is non-critical
                }
              }
            } else {
              // Fallback to token values if DB lookup fails
              session.user.role = token.role as string;
              session.user.institutionId = token.institutionId as string | null | undefined;
              session.user.institutionName = token.institutionName as string | null | undefined;
            }
          } catch {
            // Fallback to token values on error to avoid breaking auth
            session.user.role = token.role as string;
            session.user.institutionId = token.institutionId as string | null | undefined;
            session.user.institutionName = token.institutionName as string | null | undefined;
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
