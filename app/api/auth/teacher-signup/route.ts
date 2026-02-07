import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is SUPER_ADMIN or ADMIN
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admins and Admins can create teacher accounts." },
        { status: 403 }
      );
    }

    const { name, email, phone, password, class: teacherClass, section, teacherId } = await request.json();

    // Validation
    if (!name || !email || !phone || !password || !teacherClass || !section || !teacherId) {
      return NextResponse.json(
        { error: "All fields are required: name, email, phone, password, class, section, and teacherId" },
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

    // Get the admin's institution
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institution: true },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create teacher user with admin's institution
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        institution: admin?.institution || null,
        password: hashedPassword,
        role: "TEACHER",
        teacherId,
        class: teacherClass,
        section,
      },
    });

    return NextResponse.json(
      {
        message: "Teacher created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          institution: user.institution,
          teacherId: user.teacherId,
          class: user.class,
          section: user.section,
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
