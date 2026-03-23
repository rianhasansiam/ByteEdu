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
      return NextResponse.json(
        { error: "Teacher not assigned to any institution" },
        { status: 400 }
      );
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
