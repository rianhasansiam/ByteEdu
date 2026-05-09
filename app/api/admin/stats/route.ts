import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;

    if (!institutionId) {
      return NextResponse.json(
        { error: "Not associated with an institution" },
        { status: 400 }
      );
    }

    // Fetch stats in parallel
    const [totalTeachers, totalStudents, totalClasses, sections, recentNotices] =
      await Promise.all([
        prisma.user.count({
          where: { institutionId, role: "TEACHER" },
        }),
        prisma.user.count({
          where: { institutionId, role: "STUDENT" },
        }),
        prisma.class.count({
          where: { institutionId },
        }),
        prisma.section.findMany({
          where: { class: { institutionId } },
          select: { id: true },
        }),
        prisma.notice.findMany({
          where: {
            OR: [
              { targetInstitutionId: institutionId },
              { targetType: "all" },
            ],
            isPublished: true,
          },
          select: {
            id: true,
            title: true,
            priority: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    // Get recent attendance records
    const recentAttendance = await prisma.attendance.findMany({
      where: {
        section: { class: { institutionId } },
      },
      select: {
        id: true,
        date: true,
        status: true,
        student: {
          select: { name: true },
        },
        section: {
          select: {
            name: true,
            class: { select: { name: true } },
          },
        },
        teacher: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      stats: {
        totalTeachers,
        totalStudents,
        totalClasses,
        totalSections: sections.length,
      },
      recentActivity: {
        notices: recentNotices.map((n) => ({
          id: n.id,
          title: n.title,
          priority: n.priority,
          date: (n.publishedAt || n.createdAt).toISOString(),
          type: "notice",
        })),
        attendance: recentAttendance.map((a) => ({
          id: a.id,
          studentName: a.student.name,
          className: a.section.class.name,
          sectionName: a.section.name,
          teacherName: a.teacher.name,
          status: a.status,
          date: a.date.toISOString(),
          type: "attendance",
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
