import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const examType = searchParams.get("examType");

    const where: Record<string, unknown> = { studentId: session.user.id };
    if (examType) where.examType = examType;

    const marks = await prisma.studentMark.findMany({
      where,
      orderBy: { date: "desc" },
      include: { subject: { select: { name: true, code: true } } },
    });

    return NextResponse.json({
      results: marks.map((m) => ({
        id: m.id,
        subjectName: m.subject.name,
        subjectCode: m.subject.code,
        marks: m.marks,
        maxMarks: m.maxMarks,
        examType: m.examType,
        grade: getGrade(m.marks, m.maxMarks),
        notes: m.notes,
        date: m.date.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching student results:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getGrade(marks: number | null, maxMarks: number): string {
  if (marks === null) return "-";
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "A-";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}
