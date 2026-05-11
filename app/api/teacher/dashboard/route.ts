import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTeacherProfile, getTeacherDashboardStats } from "@/lib/db/teacher";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "TEACHER") {
      return NextResponse.json(
        { error: "Access denied. Teachers only." },
        { status: 403 }
      );
    }

    const teacherId = session.user.id;
    const institutionId = session.user.institutionId;

    if (!institutionId) {
      // Return valid empty dashboard for teachers without an institution assignment
      const profile = await getTeacherProfile(teacherId);
      return NextResponse.json({
        success: true,
        data: {
          profile: profile ? {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            phone: profile.phone,
            picture: profile.picture,
            teacherId: profile.teacherId,
            institution: null,
            assignedSubjects: [],
            classTeacherOf: [],
          } : { id: teacherId, name: session.user.name, email: session.user.email, institution: null, assignedSubjects: [], classTeacherOf: [] },
          stats: {
            totalStudents: 0,
            attendanceSummary: { present: 0, absent: 0, late: 0, excused: 0 },
            totalAssignedSections: 0,
            totalSubjects: 0,
            isClassTeacher: false,
          },
        },
      });
    }

    // Fetch teacher profile and dashboard stats in parallel
    const [profile, stats] = await Promise.all([
      getTeacherProfile(teacherId),
      getTeacherDashboardStats(teacherId, institutionId),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "Teacher profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          picture: profile.picture,
          teacherId: profile.teacherId,
          institution: profile.institution,
          assignedSubjects: profile.teacherAssignments.map((a) => ({
            id: a.subject.id,
            name: a.subject.name,
            section: {
              id: a.section.id,
              name: a.section.name,
              className: a.section.class.name,
            },
          })),
          classTeacherOf: profile.classTeacherOf.map((s) => ({
            id: s.id,
            name: s.name,
            className: s.class.name,
            studentCount: s._count.students,
          })),
        },
        stats,
      },
    });
  } catch (error) {
    console.error("Error fetching teacher dashboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
