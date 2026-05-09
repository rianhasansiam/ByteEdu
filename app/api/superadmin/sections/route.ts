import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSection } from "@/lib/db/classes";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { classId, name, classTeacherId } = await request.json();

    if (!classId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: classId and name are required" },
        { status: 400 }
      );
    }

    const result = await createSection(classId, name, classTeacherId);

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating section:", error);
    
    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A section with this name already exists in this class" },
        { status: 400 }
      );
    }
    
    // Handle Prisma foreign key errors
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid class ID or teacher ID" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create section" },
      { status: 500 }
    );
  }
}
