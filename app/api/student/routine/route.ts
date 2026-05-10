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
      return NextResponse.json({ routine: [], message: "No section assigned" });
    }

    const routines = await prisma.classRoutine.findMany({
      where: { sectionId: student.sectionId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const grouped = dayNames.map((dayName, index) => ({
      day: dayName,
      dayIndex: index,
      slots: routines
        .filter((r) => r.dayOfWeek === index)
        .map((r) => ({
          id: r.id,
          subjectName: r.subject.name,
          teacherName: r.teacher.name,
          startTime: r.startTime,
          endTime: r.endTime,
          roomNumber: r.roomNumber,
        })),
    }));

    return NextResponse.json({ routine: grouped });
  } catch (error) {
    console.error("Error fetching student routine:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
