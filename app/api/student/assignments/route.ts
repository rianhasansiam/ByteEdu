import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { sectionId: true },
    });

    if (!student?.sectionId) {
      return NextResponse.json({ assignments: [] });
    }

    const assignments = await prisma.assignment.findMany({
      where: { sectionId: student.sectionId },
      orderBy: { dueDate: "desc" },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
        submissions: {
          where: { studentId: session.user.id },
          select: { id: true, submittedAt: true, isLate: true, grade: true, feedback: true },
        },
      },
    });

    return NextResponse.json({
      assignments: assignments.map((a) => {
        const submission = a.submissions[0] || null;
        const now = new Date();
        const isPastDue = new Date(a.dueDate) < now;
        let status = "Pending";
        if (submission) {
          status = submission.grade ? "Checked" : submission.isLate ? "Late Submitted" : "Submitted";
        } else if (isPastDue) {
          status = "Overdue";
        }

        return {
          id: a.id,
          title: a.title,
          description: a.description,
          subjectName: a.subject.name,
          teacherName: a.teacher.name,
          dueDate: a.dueDate.toISOString(),
          createdAt: a.createdAt.toISOString(),
          status,
          submission: submission ? {
            id: submission.id,
            submittedAt: submission.submittedAt.toISOString(),
            isLate: submission.isLate,
            grade: submission.grade,
            feedback: submission.feedback,
          } : null,
        };
      }),
    });
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Submit assignment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { assignmentId, content } = await request.json();
    if (!assignmentId) {
      return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
    }

    // Verify assignment exists and belongs to student's section
    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { sectionId: true },
    });

    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, sectionId: student?.sectionId || "" },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const isLate = new Date() > new Date(assignment.dueDate);

    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: { assignmentId, studentId: session.user.id },
      },
      update: { content, isLate, submittedAt: new Date() },
      create: {
        assignmentId,
        studentId: session.user.id,
        content,
        isLate,
      },
    });

    return NextResponse.json({ success: true, submission });
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
