import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get submissions for an assignment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get("assignmentId");
    if (!assignmentId) return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });

    // Verify assignment belongs to this teacher
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, teacherId: session.user.id },
      include: { subject: { select: { name: true } } },
    });
    if (!assignment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId },
      include: { student: { select: { name: true, email: true, roll: true } } },
      orderBy: { submittedAt: "desc" },
    });

    return NextResponse.json({
      assignment: { id: assignment.id, title: assignment.title, subjectName: assignment.subject.name },
      submissions: submissions.map((s) => ({
        id: s.id,
        studentName: s.student.name,
        studentEmail: s.student.email,
        studentRoll: s.student.roll,
        content: s.content,
        submittedAt: s.submittedAt.toISOString(),
        isLate: s.isLate,
        grade: s.grade,
        feedback: s.feedback,
      })),
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Grade a submission
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { submissionId, grade, feedback } = await request.json();
    if (!submissionId) return NextResponse.json({ error: "Submission ID required" }, { status: 400 });

    // Verify this submission belongs to the teacher's assignment
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: { assignment: { select: { teacherId: true } } },
    });
    if (!submission || submission.assignment.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: { grade, feedback },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error grading submission:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
