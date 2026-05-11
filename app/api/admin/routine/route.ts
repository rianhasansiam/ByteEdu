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

    const sections = await prisma.section.findMany({
      where: { class: { institutionId } },
      include: { class: { select: { name: true } } },
    });

    const sectionIds = sections.map((s) => s.id);
    const routines = await prisma.classRoutine.findMany({
      where: { sectionId: { in: sectionIds } },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      include: {
        section: { include: { class: { select: { name: true } } } },
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    return NextResponse.json({
      routines: routines.map((r) => ({
        id: r.id,
        className: r.section.class.name,
        sectionName: r.section.name,
        sectionId: r.sectionId,
        subjectName: r.subject.name,
        teacherName: r.teacher.name,
        dayOfWeek: r.dayOfWeek,
        startTime: r.startTime,
        endTime: r.endTime,
        roomNumber: r.roomNumber,
      })),
    });
  } catch (error) {
    console.error("Error fetching routines:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { sectionId, subjectId, teacherId, dayOfWeek, startTime, endTime, roomNumber } = await request.json();
    if (!sectionId || !subjectId || !teacherId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const routine = await prisma.classRoutine.create({
      data: { sectionId, subjectId, teacherId, dayOfWeek: Number(dayOfWeek), startTime, endTime, roomNumber },
    });

    return NextResponse.json({ success: true, routine }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json({ error: "This time slot is already occupied" }, { status: 409 });
    }
    console.error("Error creating routine:", error);
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

    // Verify routine belongs to this institution before deleting
    const routine = await prisma.classRoutine.findFirst({
      where: { id, section: { class: { institutionId } } },
    });
    if (!routine) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.classRoutine.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting routine:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
