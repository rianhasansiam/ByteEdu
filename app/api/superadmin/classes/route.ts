import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClass } from "@/lib/db/classes";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { institutionId, name, displayOrder } = await request.json();

    if (!institutionId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: institutionId and name are required" },
        { status: 400 }
      );
    }

    const result = await createClass(
      institutionId,
      name,
      displayOrder || 0
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Error creating class:", error);
    
    // Handle Prisma unique constraint errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "A class with this name already exists in this institution" },
        { status: 400 }
      );
    }
    
    // Handle Prisma foreign key errors
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Invalid institution ID" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to create class" },
      { status: 500 }
    );
  }
}
