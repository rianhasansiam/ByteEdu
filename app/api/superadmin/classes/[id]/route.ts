import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { deleteClass, updateClass } from "@/lib/db/classes";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { name, displayOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing class ID" }, { status: 400 });
    }

    if (!name || displayOrder === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const result = await updateClass(id, name, displayOrder);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error updating class:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing class ID" }, { status: 400 });
    }

    await deleteClass(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
