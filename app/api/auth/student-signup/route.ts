import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated and is SUPER_ADMIN, ADMIN, or TEACHER
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== "SUPER_ADMIN" &&
        session.user.role !== "ADMIN" &&
        session.user.role !== "TEACHER")
    ) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Only Super Admins, Admins, and Teachers can create student accounts.",
        },
        { status: 403 }
      );
    }

    const {
      name,
      email,
      phone,
      password,
      class: studentClass,
      section,
      roll,
    } = await request.json();

    // Validation
    if (
      !name ||
      !email ||
      !phone ||
      !password ||
      !studentClass ||
      !section ||
      !roll
    ) {
      return NextResponse.json(
        {
          error:
            "All fields are required: name, email, phone, password, class, section, and roll",
        },
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

    // Get the creator's institution (admin/teacher)
    const creator = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institution: true },
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create student user with creator's institution
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        institution: creator?.institution || null,
        password: hashedPassword,
        role: "STUDENT",
        class: studentClass,
        section,
        roll,
      },
    });

    return NextResponse.json(
      {
        message: "Student account created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution,
          class: user.class,
          section: user.section,
          roll: user.roll,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Student signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
