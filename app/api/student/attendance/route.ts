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
    const month = searchParams.get("month"); // "2026-05"
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = { studentId: session.user.id };

    if (month) {
      const [year, m] = month.split("-").map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 1);
      where.date = { gte: start, lt: end };
    } else if (startDate && endDate) {
      where.date = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        section: {
          include: { class: { select: { name: true } } },
        },
        teacher: { select: { name: true } },
      },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === "PRESENT").length;
    const absent = records.filter((r) => r.status === "ABSENT").length;
    const late = records.filter((r) => r.status === "LATE").length;
    const excused = records.filter((r) => r.status === "EXCUSED").length;
    const percentage = total > 0 ? (((present + late) / total) * 100).toFixed(1) : "0";

    return NextResponse.json({
      records: records.map((r) => ({
        id: r.id,
        date: r.date.toISOString(),
        status: r.status,
        remarks: r.remarks,
        className: r.section?.class?.name || "Unknown",
        sectionName: r.section?.name || "Unknown",
        teacherName: r.teacher?.name || "Unknown",
      })),
      stats: { total, present, absent, late, excused, percentage },
    });
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
