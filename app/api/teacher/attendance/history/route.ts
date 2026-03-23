import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAttendanceHistory } from "@/lib/db/teacher";

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const sectionId = searchParams.get("sectionId") || undefined;
    const studentId = searchParams.get("studentId") || undefined;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    // Parse dates if provided
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    // Validate date range
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        { error: "Start date cannot be after end date" },
        { status: 400 }
      );
    }

    const result = await getAttendanceHistory(
      teacherId,
      sectionId,
      studentId,
      startDate,
      endDate,
      page,
      limit
    );

    // Transform the records for response
    const formattedRecords = result.records.map((record) => ({
      id: record.id,
      date: record.date.toISOString().split("T")[0],
      status: record.status,
      remarks: record.remarks,
      student: {
        id: record.student.id,
        name: record.student.name,
        roll: record.student.roll,
      },
      section: {
        id: record.section.id,
        name: record.section.name,
        className: record.section.class.name,
      },
    }));

    // Group by date for easier frontend consumption (optional)
    const groupedByDate = formattedRecords.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(record);
      return acc;
    }, {} as Record<string, typeof formattedRecords>);

    return NextResponse.json({
      success: true,
      data: {
        records: formattedRecords,
        groupedByDate,
      },
      pagination: result.pagination,
      filters: {
        sectionId,
        studentId,
        startDate: startDate?.toISOString().split("T")[0],
        endDate: endDate?.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
