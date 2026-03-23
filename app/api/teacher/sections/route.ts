import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { 
  getClassTeacherSections,
  getTeacherAssignedSections 
} from "@/lib/db/teacher";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Access denied. Teachers only." },
        { status: 403 }
      );
    }

    const teacherId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'class-teacher' or 'assigned'

    if (type === "class-teacher") {
      const sections = await getClassTeacherSections(teacherId);
      return NextResponse.json({
        success: true,
        data: sections.map((s) => ({
          id: s.id,
          name: s.name,
          className: s.class.name,
          classId: s.class.id,
          studentCount: s._count.students,
        })),
      });
    }

    if (type === "assigned") {
      const assignments = await getTeacherAssignedSections(teacherId);
      return NextResponse.json({
        success: true,
        data: assignments.map((a) => ({
          id: a.section.id,
          name: a.section.name,
          className: a.section.class.name,
          classId: a.section.class.id,
          studentCount: a.section._count.students,
          subject: {
            id: a.subject.id,
            name: a.subject.name,
          },
        })),
      });
    }

    // Return all sections (both class teacher and assigned)
    const [classTeacherSections, assignedSections] = await Promise.all([
      getClassTeacherSections(teacherId),
      getTeacherAssignedSections(teacherId),
    ]);

    // Combine and deduplicate
    const allSections = new Map();

    classTeacherSections.forEach((s) => {
      allSections.set(s.id, {
        id: s.id,
        name: s.name,
        className: s.class.name,
        classId: s.class.id,
        studentCount: s._count.students,
        isClassTeacher: true,
        subjects: [],
      });
    });

    assignedSections.forEach((a) => {
      if (allSections.has(a.section.id)) {
        const existing = allSections.get(a.section.id);
        existing.subjects.push({
          id: a.subject.id,
          name: a.subject.name,
        });
      } else {
        allSections.set(a.section.id, {
          id: a.section.id,
          name: a.section.name,
          className: a.section.class.name,
          classId: a.section.class.id,
          studentCount: a.section._count.students,
          isClassTeacher: false,
          subjects: [{
            id: a.subject.id,
            name: a.subject.name,
          }],
        });
      }
    });

    return NextResponse.json({
      success: true,
      data: Array.from(allSections.values()),
    });
  } catch (error) {
    console.error("Error fetching sections:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
