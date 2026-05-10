import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch teacher's sections, unassigned students, and current assignments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const teacherId = session.user.id;
    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    // Get sections where this teacher is class teacher OR has assignments
    const [classTeacherSections, assignedSections] = await Promise.all([
      prisma.section.findMany({
        where: { classTeacherId: teacherId },
        include: {
          class: { select: { id: true, name: true } },
          _count: { select: { students: true } },
        },
      }),
      prisma.teacherAssignment.findMany({
        where: { teacherId },
        include: {
          section: {
            include: {
              class: { select: { id: true, name: true } },
              _count: { select: { students: true } },
            },
          },
        },
      }),
    ]);

    // Merge and deduplicate sections
    const sectionMap = new Map<string, any>();
    classTeacherSections.forEach((s) => {
      sectionMap.set(s.id, {
        id: s.id,
        name: s.name,
        className: s.class.name,
        classId: s.class.id,
        studentCount: s._count.students,
        isClassTeacher: true,
      });
    });
    assignedSections.forEach((a) => {
      if (!sectionMap.has(a.section.id)) {
        sectionMap.set(a.section.id, {
          id: a.section.id,
          name: a.section.name,
          className: a.section.class.name,
          classId: a.section.class.id,
          studentCount: a.section._count.students,
          isClassTeacher: false,
        });
      }
    });

    const sections = Array.from(sectionMap.values());

    // Get unassigned students in this institution
    const unassignedStudents = await prisma.user.findMany({
      where: {
        institutionId,
        role: "STUDENT",
        sectionId: null,
      },
      select: { id: true, name: true, email: true, roll: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ sections, unassignedStudents });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Assign or remove student from section
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const teacherId = session.user.id;
    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    const body = await request.json();
    const { studentId, sectionId, action } = body;

    if (!studentId) {
      return NextResponse.json({ error: "studentId required" }, { status: 400 });
    }

    // Verify the student belongs to the teacher's institution
    const student = await prisma.user.findFirst({
      where: { id: studentId, role: "STUDENT", institutionId },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (action === "assign") {
      if (!sectionId) {
        return NextResponse.json({ error: "sectionId required" }, { status: 400 });
      }

      // Verify teacher has access to this section
      const hasAccess = await verifyTeacherSectionAccess(teacherId, sectionId);
      if (!hasAccess) {
        return NextResponse.json({ error: "You don't have access to this section" }, { status: 403 });
      }

      const updated = await prisma.user.update({
        where: { id: studentId },
        data: { sectionId },
        select: { id: true, name: true, sectionId: true },
      });

      return NextResponse.json({ success: true, student: updated });
    }

    if (action === "remove") {
      // Verify teacher has access to student's current section
      if (student.sectionId) {
        const hasAccess = await verifyTeacherSectionAccess(teacherId, student.sectionId);
        if (!hasAccess) {
          return NextResponse.json({ error: "You don't have access to this section" }, { status: 403 });
        }
      }

      const updated = await prisma.user.update({
        where: { id: studentId },
        data: { sectionId: null },
        select: { id: true, name: true, sectionId: true },
      });

      return NextResponse.json({ success: true, student: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function verifyTeacherSectionAccess(teacherId: string, sectionId: string): Promise<boolean> {
  const isClassTeacher = await prisma.section.findFirst({
    where: { id: sectionId, classTeacherId: teacherId },
  });
  if (isClassTeacher) return true;

  const isAssigned = await prisma.teacherAssignment.findFirst({
    where: { teacherId, sectionId },
  });
  return !!isAssigned;
}
