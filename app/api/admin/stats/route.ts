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

    // Fetch everything in parallel
    const [
      institution,
      totalTeachers,
      totalStudents,
      totalAdmins,
      totalUsers,
      totalClasses,
      sections,
      totalSubjects,
      recentNotices,
      subscription,
      recentAttendance,
      unassignedStudents,
      teacherAssignments,
    ] = await Promise.all([
      prisma.institution.findUnique({
        where: { id: institutionId },
        select: { id: true, name: true, status: true, createdAt: true },
      }),
      prisma.user.count({ where: { institutionId, role: "TEACHER" } }),
      prisma.user.count({ where: { institutionId, role: "STUDENT" } }),
      prisma.user.count({ where: { institutionId, role: "ADMIN" } }),
      prisma.user.count({ where: { institutionId } }),
      prisma.class.count({ where: { institutionId } }),
      prisma.section.findMany({
        where: { class: { institutionId } },
        select: { id: true },
      }),
      prisma.subject.count({ where: { institutionId } }),
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
      prisma.subscription.findFirst({
        where: { institutionId },
        include: { plan: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.attendance.findMany({
        where: { section: { class: { institutionId } } },
        select: {
          id: true,
          date: true,
          status: true,
          student: { select: { name: true } },
          section: {
            select: {
              name: true,
              class: { select: { name: true } },
            },
          },
          teacher: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.user.count({ where: { institutionId, role: "STUDENT", sectionId: null } }),
      prisma.teacherAssignment.count({
        where: { teacher: { institutionId } },
      }),
    ]);

    // Today's attendance summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        section: { class: { institutionId } },
        date: { gte: today, lt: tomorrow },
      },
      _count: true,
    });

    const attendanceSummary = {
      present: todayAttendance.find((a) => a.status === "PRESENT")?._count || 0,
      absent: todayAttendance.find((a) => a.status === "ABSENT")?._count || 0,
      late: todayAttendance.find((a) => a.status === "LATE")?._count || 0,
      excused: todayAttendance.find((a) => a.status === "EXCUSED")?._count || 0,
    };

    return NextResponse.json({
      institution,
      stats: {
        totalTeachers,
        totalStudents,
        totalAdmins,
        totalUsers,
        totalClasses,
        totalSections: sections.length,
        totalSubjects,
        unassignedStudents,
        teacherAssignments,
      },
      subscription: subscription
        ? {
            planName: subscription.plan.name,
            status: subscription.paymentStatus,
            endDate: subscription.endDate.toISOString(),
            amount: subscription.amount,
            billingCycle: subscription.billingCycle,
          }
        : null,
      attendanceSummary,
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
