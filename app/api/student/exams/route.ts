import { NextResponse } from "next/server";
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
      return NextResponse.json({ exams: [] });
    }

    const exams = await prisma.exam.findMany({
      where: { sectionId: student.sectionId },
      orderBy: { date: "asc" },
      include: {
        subject: { select: { name: true } },
      },
    });

    return NextResponse.json({
      exams: exams.map((e) => ({
        id: e.id,
        name: e.name,
        subjectName: e.subject.name,
        date: e.date.toISOString(),
        startTime: e.startTime,
        endTime: e.endTime,
        roomNumber: e.roomNumber,
        syllabus: e.syllabus,
        instructions: e.instructions,
      })),
    });
  } catch (error) {
    console.error("Error fetching student exams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
