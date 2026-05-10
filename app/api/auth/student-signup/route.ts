import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (
      !session ||
      (session.user.role !== "SUPER_ADMIN" &&
        session.user.role !== "ADMIN" &&
        session.user.role !== "TEACHER")
    ) {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admins, Admins, and Teachers can create student accounts." },
        { status: 403 }
      );
    }

    const { name, email, phone, password, sectionId, roll } = await request.json();

    // Required fields only: name, email, phone, password
    if (!name || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Name, email, phone, and password are required" },
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
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Resolve institutionId
    let institutionId: string | null = null;

    if (sectionId) {
      // If section is provided, validate it and get institution from it
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
        include: { class: { include: { institution: true } } },
      });

      if (!section) {
        return NextResponse.json({ error: "Section not found" }, { status: 404 });
      }

      // For non-SUPER_ADMIN, ensure section belongs to their institution
      if (session.user.role !== "SUPER_ADMIN") {
        if (session.user.institutionId !== section.class.institutionId) {
          return NextResponse.json(
            { error: "You can only add students to sections in your institution" },
            { status: 403 }
          );
        }
      }

      institutionId = section.class.institutionId;
    } else {
      // No section provided — get institution from session (for ADMIN/TEACHER)
      // For SUPER_ADMIN without sectionId, institutionId stays null (unassigned)
      if (session.user.role !== "SUPER_ADMIN") {
        institutionId = session.user.institutionId ?? null;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        institutionId,
        password: hashedPassword,
        role: "STUDENT",
        sectionId: sectionId || null,
        roll: roll || null,
      },
      include: {
        institution: true,
        section: { include: { class: true } },
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
          institutionId: user.institutionId,
          institutionName: user.institution?.name,
          sectionId: user.sectionId,
          sectionName: user.section?.name,
          className: user.section?.class.name,
          roll: user.roll,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Student signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
