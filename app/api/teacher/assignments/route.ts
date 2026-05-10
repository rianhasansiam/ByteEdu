import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { teacherId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { name: true } },
        section: { include: { class: { select: { name: true } } } },
        _count: { select: { submissions: true } },
      },
    });

    // Get total students per section for submission rate
    const sectionIds = [...new Set(assignments.map((a) => a.sectionId))];
    const sectionStudentCounts = await prisma.user.groupBy({
      by: ["sectionId"],
      where: { sectionId: { in: sectionIds }, role: "STUDENT" },
      _count: true,
    });
    const countMap = Object.fromEntries(sectionStudentCounts.map((s) => [s.sectionId, s._count]));

    return NextResponse.json({
      assignments: assignments.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        subjectName: a.subject.name,
        className: a.section.class.name,
        sectionName: a.section.name,
        dueDate: a.dueDate.toISOString(),
        createdAt: a.createdAt.toISOString(),
        submissionCount: a._count.submissions,
        totalStudents: countMap[a.sectionId] || 0,
      })),
    });
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { title, description, sectionId, subjectId, dueDate } = await request.json();
    if (!title || !sectionId || !subjectId || !dueDate) {
      return NextResponse.json({ error: "Title, section, subject, and due date required" }, { status: 400 });
    }

    // Verify teacher is assigned to this section/subject
    const assignment_check = await prisma.teacherAssignment.findFirst({
      where: { teacherId: session.user.id, sectionId, subjectId },
    });
    if (!assignment_check) {
      return NextResponse.json({ error: "You are not assigned to this section/subject" }, { status: 403 });
    }

    const assignment = await prisma.assignment.create({
      data: { title, description, sectionId, subjectId, teacherId: session.user.id, dueDate: new Date(dueDate) },
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.assignment.findFirst({ where: { id, teacherId: session.user.id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.assignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
