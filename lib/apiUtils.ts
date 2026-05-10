import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Standardized API response helpers
 */
export function apiSuccess(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/**
 * Combined auth + institution check for admin/teacher API routes.
 * Returns the session with institutionId, or an error response.
 *
 * @param allowedRoles - Array of roles allowed to access this endpoint.
 *   Pass null to skip role checking (only checks authentication).
 */
export async function authAndInstitution(
  allowedRoles: string[] | null = null
): Promise<
  | { success: true; session: any; institutionId: string; userId: string; role: string }
  | { success: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { success: false, response: apiError("Unauthorized", 401) };
  }

  const user = session.user as any;
  const role = user.role as string;

  // Role check (if specified)
  if (allowedRoles && !allowedRoles.includes(role)) {
    return { success: false, response: apiError("Forbidden", 403) };
  }

  // Institution check (skip for SUPER_ADMIN — they can operate without an institution)
  const institutionId = user.institutionId as string;
  if (!institutionId && role !== "SUPER_ADMIN") {
    return {
      success: false,
      response: apiError("No institution associated", 403),
    };
  }

  return {
    success: true,
    session,
    institutionId,
    userId: user.id as string,
    role,
  };
}
