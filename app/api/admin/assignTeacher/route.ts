import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getInstitutionId(session: any): Promise<string | null> {
  if (session.user.role === "SUPER_ADMIN") {
    // For super admin, they might pass institutionId as query param
    return session.user.institutionId || null;
  }
  return session.user.institutionId || null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = await getInstitutionId(session);
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    // Fetch all data in parallel
    const [classes, teachers, subjects, assignments] = await Promise.all([
      prisma.class.findMany({
        where: { institutionId },
        include: {
          sections: {
            select: { id: true, name: true },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.user.findMany({
        where: { institutionId, role: "TEACHER" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
      prisma.subject.findMany({
        where: { institutionId },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
      prisma.teacherAssignment.findMany({
        where: {
          section: { class: { institutionId } },
        },
        include: {
          teacher: { select: { id: true, name: true, email: true } },
          subject: { select: { id: true, name: true, code: true } },
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      classes,
      teachers,
      subjects,
      assignments: assignments.map((a) => ({
        id: a.id,
        teacherId: a.teacher.id,
        teacherName: a.teacher.name,
        teacherEmail: a.teacher.email,
        subjectId: a.subject.id,
        subjectName: a.subject.name,
        subjectCode: a.subject.code,
        sectionId: a.section.id,
        sectionName: a.section.name,
        classId: a.section.class.id,
        className: a.section.class.name,
      })),
    });
  } catch (error) {
    console.error("Error fetching assign teacher data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { teacherId, sectionId, subjectId } = body;

    if (!teacherId || !sectionId || !subjectId) {
      return NextResponse.json(
        { error: "Teacher, section, and subject are required" },
        { status: 400 }
      );
    }

    // Check if assignment already exists
    const existing = await prisma.teacherAssignment.findUnique({
      where: {
        teacherId_sectionId_subjectId: { teacherId, sectionId, subjectId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This teacher is already assigned to this subject in this section" },
        { status: 409 }
      );
    }

    const assignment = await prisma.teacherAssignment.create({
      data: { teacherId, sectionId, subjectId },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        subject: { select: { id: true, name: true, code: true } },
        section: {
          select: {
            id: true,
            name: true,
            class: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      assignment: {
        id: assignment.id,
        teacherId: assignment.teacher.id,
        teacherName: assignment.teacher.name,
        teacherEmail: assignment.teacher.email,
        subjectId: assignment.subject.id,
        subjectName: assignment.subject.name,
        subjectCode: assignment.subject.code,
        sectionId: assignment.section.id,
        sectionName: assignment.section.name,
        classId: assignment.section.class.id,
        className: assignment.section.class.name,
      },
    });
  } catch (error) {
    console.error("Error assigning teacher:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("id");

    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    // Verify the assignment belongs to this institution
    const assignment = await prisma.teacherAssignment.findFirst({
      where: { id: assignmentId, section: { class: { institutionId } } },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    await prisma.teacherAssignment.delete({
      where: { id: assignmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing teacher assignment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
