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
    const rateCheck = await checkRateLimit(`teacher-signup:${ip}`, RATE_LIMITS.AUTH);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
      );
    }

    // Check if user is authenticated and is SUPER_ADMIN or ADMIN
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admins and Admins can create teacher accounts." },
        { status: 403 }
      );
    }

    const { name, email, phone, password, teacherId, sectionId, subjectId, institutionId: requestInstitutionId } = await request.json();

    // Validation
    if (!name || !email || !phone || !password || !teacherId) {
      return NextResponse.json(
        { error: "All fields are required: name, email, phone, password, and teacherId" },
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

    // Determine the institutionId based on role
    let finalInstitutionId: string | null = null;

    if (session.user.role === "SUPER_ADMIN") {
      // Super Admin can specify institutionId or leave it null
      if (requestInstitutionId) {
        // Verify institution exists
        const institution = await prisma.institution.findUnique({
          where: { id: requestInstitutionId },
        });
        if (!institution) {
          return NextResponse.json(
            { error: "Institution not found" },
            { status: 404 }
          );
        }
        finalInstitutionId = requestInstitutionId;
      }
    } else {
      // Admin must have an institution and can only create teachers in their institution
      const admin = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { institutionId: true },
      });

      if (!admin?.institutionId) {
        return NextResponse.json(
          { error: "Admin must belong to an institution to create teachers" },
          { status: 400 }
        );
      }
      finalInstitutionId = admin.institutionId;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create teacher user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        institutionId: finalInstitutionId,
        password: hashedPassword,
        role: "TEACHER",
        teacherId,
      },
      include: {
        institution: true,
      },
    });

    // If sectionId and subjectId are provided, create a teacher assignment
    if (sectionId && subjectId) {
      await prisma.teacherAssignment.create({
        data: {
          teacherId: user.id,
          sectionId,
          subjectId,
        },
      });
    }

    // Invalidate all caches so dashboards reflect the new teacher
    // Wrapped in try/catch — cache failure must never affect the user response
    try {
      await invalidateAfterUserMutation({
        userId: user.id,
        institutionId: finalInstitutionId,
        role: "TEACHER",
      });
    } catch (cacheError) {
      console.error("[teacher-signup] Cache invalidation failed (non-fatal):", cacheError);
    }

    return NextResponse.json(
      {
        message: "Teacher created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          institutionId: user.institutionId,
          institutionName: user.institution?.name,
          teacherId: user.teacherId,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Teacher signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
