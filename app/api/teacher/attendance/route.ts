import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { 
  getAttendanceByDateAndSection,
  checkAttendanceExists,
  submitAttendance,
  AttendanceRecord
} from "@/lib/db/teacher";
import { AttendanceStatus } from "@/app/generated/prisma/client";

// GET - Fetch attendance for a section on a specific date
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
    const sectionId = searchParams.get("sectionId");
    const dateStr = searchParams.get("date");

    if (!sectionId) {
      return NextResponse.json(
        { error: "Section ID is required" },
        { status: 400 }
      );
    }

    // Verify teacher has access to this section
    const hasAccess = await verifyTeacherSectionAccess(teacherId, sectionId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this section" },
        { status: 403 }
      );
    }

    // Parse date or use today
    const date = dateStr ? new Date(dateStr) : new Date();

    // Check if attendance exists for this date
    const attendanceExists = await checkAttendanceExists(sectionId, date);

    // Get attendance records if they exist
    const attendance = await getAttendanceByDateAndSection(sectionId, date);

    // Get all students in the section for marking attendance
    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        sectionId: sectionId,
        institutionId: institutionId,
      },
      select: {
        id: true,
        name: true,
        roll: true,
      },
      orderBy: [{ roll: "asc" }, { name: "asc" }],
    });

    // Merge attendance records with student list
    const attendanceMap = new Map(
      attendance.map((a) => [a.student.id, a])
    );

    const studentsWithAttendance = students.map((student) => {
      const record = attendanceMap.get(student.id);
      return {
        studentId: student.id,
        name: student.name,
        roll: student.roll,
        status: record?.status || null,
        remarks: record?.remarks || null,
        attendanceId: record?.id || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        sectionId,
        date: date.toISOString().split("T")[0],
        attendanceExists,
        students: studentsWithAttendance,
      },
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Submit attendance for a section
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { sectionId, date, records } = body as {
      sectionId: string;
      date: string;
      records: Array<{
        studentId: string;
        status: AttendanceStatus;
        remarks?: string;
      }>;
    };

    // Validate required fields
    if (!sectionId || !date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Invalid request body. Required: sectionId, date, records[]" },
        { status: 400 }
      );
    }

    // Validate attendance status values
    const validStatuses: AttendanceStatus[] = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];
    for (const record of records) {
      if (!record.studentId || !record.status) {
        return NextResponse.json(
          { error: "Each record must have studentId and status" },
          { status: 400 }
        );
      }
      if (!validStatuses.includes(record.status)) {
        return NextResponse.json(
          { error: `Invalid status: ${record.status}. Valid values: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Verify teacher has access to this section
    const hasAccess = await verifyTeacherSectionAccess(teacherId, sectionId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this section" },
        { status: 403 }
      );
    }

    // Verify all students belong to this section and institution
    const studentIds = records.map((r) => r.studentId);
    const validStudents = await prisma.user.count({
      where: {
        id: { in: studentIds },
        role: "STUDENT",
        sectionId: sectionId,
        institutionId: institutionId,
      },
    });

    if (validStudents !== studentIds.length) {
      return NextResponse.json(
        { error: "Some students are not valid for this section" },
        { status: 400 }
      );
    }

    // Submit attendance
    const attendanceDate = new Date(date);
    const attendanceRecords: AttendanceRecord[] = records.map((r) => ({
      studentId: r.studentId,
      status: r.status,
      remarks: r.remarks,
    }));

    const result = await submitAttendance(
      teacherId,
      sectionId,
      attendanceDate,
      attendanceRecords
    );

    return NextResponse.json({
      success: true,
      message: "Attendance submitted successfully",
      data: {
        sectionId,
        date: attendanceDate.toISOString().split("T")[0],
        recordsProcessed: result.length,
      },
    });
  } catch (error) {
    console.error("Error submitting attendance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to verify teacher has access to a section
async function verifyTeacherSectionAccess(
  teacherId: string,
  sectionId: string
): Promise<boolean> {
  // Check if teacher is class teacher of this section
  const isClassTeacher = await prisma.section.findFirst({
    where: {
      id: sectionId,
      classTeacherId: teacherId,
    },
  });

  if (isClassTeacher) return true;

  // Check if teacher is assigned to teach any subject in this section
  const isAssigned = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId,
      sectionId,
    },
  });

  return !!isAssigned;
}
