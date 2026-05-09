import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assignTeacherToSection, removeTeacherFromSection } from "@/lib/db/classes";

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
    const { teacherId, sectionId, subjectId, action, assignmentId } = body;

    if (action === "assign") {
      if (!teacherId || !sectionId || !subjectId) {
        return NextResponse.json(
          { error: "Missing required fields" },
          { status: 400 }
        );
      }

      const result = await assignTeacherToSection(teacherId, sectionId, subjectId);
      return NextResponse.json(result);
    } else if (action === "remove") {
      if (!assignmentId) {
        return NextResponse.json(
          { error: "Missing assignment ID" },
          { status: 400 }
        );
      }

      const result = await removeTeacherFromSection(assignmentId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error managing teacher assignment:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Teacher already assigned to this section for this subject" },
        { status: 409 }
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "Teacher, section, or subject not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
