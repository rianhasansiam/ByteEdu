import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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
    const sectionId = searchParams.get("sectionId");
    const dateStr = searchParams.get("date");

    // Get classes for filter dropdowns
    const classes = await prisma.class.findMany({
      where: { institutionId },
      include: {
        sections: {
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { displayOrder: "asc" },
    });

    // Build attendance query
    const whereClause: any = {
      section: { class: { institutionId } },
    };

    if (sectionId) {
      whereClause.sectionId = sectionId;
    }

    if (dateStr) {
      const date = new Date(dateStr);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      whereClause.date = {
        gte: startOfDay,
        lt: endOfDay,
      };
    }

    const records = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: { id: true, name: true, roll: true },
        },
        section: {
          select: {
            id: true,
            name: true,
            class: { select: { id: true, name: true } },
          },
        },
        teacher: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ date: "desc" }, { student: { roll: "asc" } }],
      take: 200,
    });

    // Calculate stats
    const stats = {
      total: records.length,
      present: records.filter((r) => r.status === "PRESENT").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      excused: records.filter((r) => r.status === "EXCUSED").length,
    };

    return NextResponse.json({
      classes,
      records: records.map((r) => ({
        id: r.id,
        studentName: r.student.name,
        studentRoll: r.student.roll,
        className: r.section.class.name,
        sectionName: r.section.name,
        teacherName: r.teacher.name,
        status: r.status,
        date: r.date.toISOString(),
        remarks: r.remarks,
      })),
      stats,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
