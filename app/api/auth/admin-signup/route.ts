import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { checkRateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { invalidateAfterUserMutation } from "@/lib/cache/invalidateAfterUserMutation";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimit(`admin-signup:${ip}`, RATE_LIMITS.AUTH);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
      );
    }

    // Check if user is authenticated and is SUPER_ADMIN
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admins can create admin accounts." },
        { status: 403 }
      );
    }

    const { name, email, phone, institutionId, password } = await request.json();

    // Validation
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Required fields: name, email, phone, and password" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Verify institution exists (only if provided)
    if (institutionId) {
      const institutionExists = await prisma.institution.findUnique({
        where: { id: institutionId },
      });

      if (!institutionExists) {
        return NextResponse.json(
          { error: "Institution not found" },
          { status: 404 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        institutionId: institutionId || null,
        password: hashedPassword,
        role: "ADMIN",
      },
      include: {
        institution: true,
      },
    });

    // Invalidate all caches so dashboards reflect the new admin
    // Wrapped in try/catch — cache failure must never affect the user response
    try {
      await invalidateAfterUserMutation({
        userId: user.id,
        institutionId: user.institutionId,
        role: "ADMIN",
      });
    } catch (cacheError) {
      console.error("[admin-signup] Cache invalidation failed (non-fatal):", cacheError);
    }

    return NextResponse.json(
      {
        message: "Admin created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          institutionId: user.institutionId,
          institutionName: user.institution?.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Admin signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
