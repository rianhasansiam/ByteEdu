import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as UserService from "@/lib/services/superadmin/users.service";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/superadmin/users/[id]
 * Get a specific user by ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { id } = await params;
    const user = await UserService.getUserById(id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/users/[id]
 * Update a user
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { id } = await params;
    const body = await request.json();
    
    const user = await UserService.updateUser(id, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      institutionId: body.institutionId,
      picture: body.picture,
      sectionId: body.sectionId,
      roll: body.roll,
      // Teacher-specific fields
      classTeacherSectionId: body.classTeacherSectionId,
      teacherAssignments: body.teacherAssignments,
    });
    
    return NextResponse.json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error updating user:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes("not found") ? 404 : 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/users/[id]
 * Delete a user
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { id } = await params;
    await UserService.deleteUser(id);
    
    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes("not found") ? 404 : 500 }
    );
  }
}
