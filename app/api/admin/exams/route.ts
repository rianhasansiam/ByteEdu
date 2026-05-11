import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const institutionId = session.user.institutionId;
    if (!institutionId) return NextResponse.json({ error: "No institution" }, { status: 400 });

    const exams = await prisma.exam.findMany({
      where: { institutionId },
      orderBy: { date: "asc" },
      include: {
        subject: { select: { name: true } },
        section: { include: { class: { select: { name: true } } } },
      },
    });

    return NextResponse.json({
      exams: exams.map((e) => ({
        id: e.id,
        name: e.name,
        subjectName: e.subject.name,
        className: e.section.class.name,
        sectionName: e.section.name,
        date: e.date.toISOString(),
        startTime: e.startTime,
        endTime: e.endTime,
        roomNumber: e.roomNumber,
        syllabus: e.syllabus,
        instructions: e.instructions,
      })),
    });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const institutionId = session.user.institutionId;
    if (!institutionId) return NextResponse.json({ error: "No institution" }, { status: 400 });

    const { name, subjectId, sectionId, date, startTime, endTime, roomNumber, syllabus, instructions } = await request.json();
    if (!name || !subjectId || !sectionId || !date) {
      return NextResponse.json({ error: "Name, subject, section, and date required" }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: { name, subjectId, sectionId, date: new Date(date), startTime, endTime, roomNumber, syllabus, instructions, institutionId },
    });

    return NextResponse.json({ success: true, exam }, { status: 201 });
  } catch (error) {
    console.error("Error creating exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) return NextResponse.json({ error: "No institution" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    // Verify exam belongs to this institution before deleting
    const exam = await prisma.exam.findFirst({
      where: { id, institutionId },
    });
    if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.exam.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting exam:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
