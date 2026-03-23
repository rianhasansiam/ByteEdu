import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const userRole = token?.role as string;

    // Helper function to redirect based on role
    const redirectToDashboard = () => {
      if (userRole === "TEACHER") {
        return NextResponse.redirect(new URL("/teacher/dashboard", req.url));
      } else if (userRole === "ADMIN") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      } else if (userRole === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/superAdmin/dashboard", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    };

    // Signup pages - check exact routes first
    if (pathname === "/teacherSignup" || pathname.startsWith("/teacherSignup/")) {
      // Only SUPER_ADMIN and ADMIN can access teacher signup
      if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
        return redirectToDashboard();
      }
      return NextResponse.next();
    }

    if (pathname === "/adminSignup" || pathname.startsWith("/adminSignup/")) {
      // Only SUPER_ADMIN can access admin signup
      if (userRole !== "SUPER_ADMIN") {
        return redirectToDashboard();
      }
      return NextResponse.next();
    }

    if (pathname === "/studentSignup" || pathname.startsWith("/studentSignup/")) {
      // SUPER_ADMIN, ADMIN, and TEACHER can access student signup
      if (!["SUPER_ADMIN", "ADMIN", "TEACHER"].includes(userRole)) {
        return redirectToDashboard();
      }
      return NextResponse.next();
    }

    // Dashboard routes
    if (pathname.startsWith("/superAdmin")) {
      if (userRole !== "SUPER_ADMIN") {
        return redirectToDashboard();
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/admin")) {
      if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
        return redirectToDashboard();
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/teacher")) {
      if (userRole !== "TEACHER") {
        return redirectToDashboard();
      }
      return NextResponse.next();
    }

    if (pathname.startsWith("/dashboard")) {
      if (!["ADMIN", "SUPER_ADMIN", "TEACHER", "STUDENT"].includes(userRole)) {
        return NextResponse.redirect(new URL("/", req.url));
      }
      return NextResponse.next();
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
    "/admin/:path*",
    "/teacher/:path*",
  ],
};
