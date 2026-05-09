import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assignStudentToSection, removeStudentFromSection } from "@/lib/db/classes";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, sectionId, action } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "Missing student ID" },
        { status: 400 }
      );
    }

    if (action === "assign") {
      if (!sectionId) {
        return NextResponse.json(
          { error: "Missing section ID" },
          { status: 400 }
        );
      }

      const result = await assignStudentToSection(studentId, sectionId);
      return NextResponse.json(result);
    } else if (action === "remove") {
      const result = await removeStudentFromSection(studentId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error managing student assignment:", error);

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Student or section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
