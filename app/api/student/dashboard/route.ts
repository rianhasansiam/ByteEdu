import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated. Please log in." }, { status: 401 });
    }
    if (session.user.role !== "STUDENT") {
      return NextResponse.json({ error: `Access denied. Your account role is '${session.user.role}', not STUDENT.` }, { status: 403 });
    }

    const studentId = session.user.id;
    const institutionId = session.user.institutionId;

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        institution: { select: { name: true } },
        section: {
          include: { class: { select: { name: true } } },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Attendance stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [attendanceRecords, todayAttendance, recentNotices, recentMarks, unreadNotifications, upcomingExams, pendingAssignments] = await Promise.all([
      prisma.attendance.groupBy({
        by: ["status"],
        where: { studentId },
        _count: true,
      }),
      prisma.attendance.findFirst({
        where: { studentId, date: { gte: today, lt: tomorrow } },
        select: { status: true },
      }),
      prisma.notice.findMany({
        where: {
          isPublished: true,
          OR: [
            { targetType: "all" },
            ...(institutionId ? [{ targetInstitutionId: institutionId }] : []),
            { targetType: "role", targetRole: "STUDENT" },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, priority: true, createdAt: true },
      }),
      prisma.studentMark.findMany({
        where: { studentId },
        orderBy: { date: "desc" },
        take: 5,
        include: { subject: { select: { name: true } } },
      }),
      prisma.notification.count({
        where: { userId: studentId, isRead: false },
      }),
      student.sectionId ? prisma.exam.findMany({
        where: { sectionId: student.sectionId, date: { gte: today } },
        orderBy: { date: "asc" },
        take: 3,
        include: { subject: { select: { name: true } } },
      }) : Promise.resolve([]),
      student.sectionId ? prisma.assignment.count({
        where: {
          sectionId: student.sectionId,
          dueDate: { gte: today },
          submissions: { none: { studentId } },
        },
      }) : Promise.resolve(0),
    ]);

    const totalRecords = attendanceRecords.reduce((sum, r) => sum + r._count, 0);
    const presentCount = attendanceRecords.find((r) => r.status === "PRESENT")?._count || 0;
    const absentCount = attendanceRecords.find((r) => r.status === "ABSENT")?._count || 0;
    const lateCount = attendanceRecords.find((r) => r.status === "LATE")?._count || 0;
    const attendancePercentage = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(1) : "0";

    return NextResponse.json({
      student: {
        name: student.name,
        email: student.email,
        roll: student.roll,
        picture: student.picture,
        className: student.section?.class?.name || null,
        sectionName: student.section?.name || null,
        institutionName: student.institution?.name || null,
      },
      attendance: {
        total: totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        percentage: attendancePercentage,
        todayStatus: todayAttendance?.status || null,
      },
      recentNotices: recentNotices.map((n) => ({
        id: n.id,
        title: n.title,
        priority: n.priority,
        date: n.createdAt.toISOString(),
      })),
      recentMarks: recentMarks.map((m) => ({
        id: m.id,
        subjectName: m.subject.name,
        marks: m.marks,
        maxMarks: m.maxMarks,
        examType: m.examType,
        date: m.date.toISOString(),
      })),
      unreadNotifications,
      upcomingExams: upcomingExams.map((e) => ({
        id: e.id,
        name: e.name,
        subjectName: e.subject.name,
        date: e.date.toISOString(),
        startTime: e.startTime,
      })),
      pendingAssignments,
    });
  } catch (error) {
    console.error("Error fetching student dashboard:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
