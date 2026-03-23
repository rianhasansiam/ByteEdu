import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTeacherStudents, getStudentDetails } from "@/lib/db/teacher";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sectionId = searchParams.get("sectionId") || undefined;
    const studentId = searchParams.get("studentId");

    // If studentId is provided, return single student details
    if (studentId) {
      const student = await getStudentDetails(studentId, institutionId);
      
      if (!student) {
        return NextResponse.json(
          { error: "Student not found or not accessible" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: student,
      });
    }

    // Otherwise, return paginated list of students
    const result = await getTeacherStudents(
      teacherId,
      institutionId,
      page,
      limit,
      sectionId
    );

    if (!result) {
      return NextResponse.json(
        { error: "Unable to fetch students or section not accessible" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.students,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
