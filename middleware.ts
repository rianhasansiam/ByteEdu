import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Define role-based access rules
    const roleBasedRoutes: Record<string, string[]> = {
      "/dashboard": ["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT"],
      "/adminSignup": ["SUPER_ADMIN"],
      "/teacherSignup": ["SUPER_ADMIN", "ADMIN"],
      "/studentSignup": ["SUPER_ADMIN", "ADMIN", "TEACHER"],
      "/superAdmin": ["SUPER_ADMIN"],
    };

    // Check if current path matches any protected route
    for (const [route, allowedRoles] of Object.entries(roleBasedRoutes)) {
      if (pathname.startsWith(route)) {
        const userRole = token?.role as string;
        
        if (!allowedRoles.includes(userRole)) {
          // Redirect to home or unauthorized page
          return NextResponse.redirect(new URL("/", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Public routes that don't require authentication
        const publicRoutes = ["/", "/login", "/superAdminSignup"];
        
        // Allow public routes
        if (publicRoutes.some((route) => pathname === route || pathname.startsWith("/_next") || pathname.startsWith("/api/auth"))) {
          return true;
        }

        // For protected routes, require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/adminSignup/:path*",
    "/teacherSignup/:path*",
    "/studentSignup/:path*",
    "/superAdmin/:path*",
  ],
};
