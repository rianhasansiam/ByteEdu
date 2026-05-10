import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

// GET - Fetch a single user's full details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    const { id } = await params;

    const user = await prisma.user.findFirst({
      where: { id, institutionId, role: { not: "SUPER_ADMIN" } },
      include: {
        institution: { select: { id: true, name: true } },
        section: {
          include: { class: { select: { id: true, name: true } } },
        },
        teacherAssignments: {
          include: {
            section: { include: { class: { select: { id: true, name: true } } } },
            subject: { select: { id: true, name: true } },
          },
        },
        classTeacherOf: {
          include: { class: { select: { id: true, name: true } } },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update a user within the admin's institution
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify user belongs to this institution and is not SUPER_ADMIN
    const existingUser = await prisma.user.findFirst({
      where: { id, institutionId, role: { not: "SUPER_ADMIN" } },
    });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Admin cannot promote to SUPER_ADMIN
    if (body.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Cannot assign Super Admin role" }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    if (body.name) updateData.name = body.name.trim();
    if (body.email) updateData.email = body.email.trim();
    if (body.phone !== undefined) updateData.phone = body.phone || null;
    if (body.role) updateData.role = body.role;

    // Student-specific
    if (body.role === "STUDENT") {
      updateData.sectionId = body.sectionId || null;
      updateData.roll = body.roll || null;
    } else {
      // Clear student fields if role is not student
      if (existingUser.role === "STUDENT" && body.role !== "STUDENT") {
        updateData.sectionId = null;
        updateData.roll = null;
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Handle teacher-specific: class teacher assignment
    if (body.role === "TEACHER" && body.classTeacherSectionId !== undefined) {
      // Remove existing class teacher assignments
      await prisma.section.updateMany({
        where: { classTeacherId: id },
        data: { classTeacherId: null },
      });

      // Set new class teacher if provided
      if (body.classTeacherSectionId) {
        await prisma.section.update({
          where: { id: body.classTeacherSectionId },
          data: { classTeacherId: id },
        });
      }
    }

    return NextResponse.json({ message: "User updated", user: updatedUser });
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete a user within the admin's institution
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    const { id } = await params;

    // Verify user belongs to this institution and is not SUPER_ADMIN or ADMIN
    const user = await prisma.user.findFirst({
      where: { id, institutionId, role: { notIn: ["SUPER_ADMIN", "ADMIN"] } },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found or cannot be deleted" }, { status: 404 });
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ message: "User deleted" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
