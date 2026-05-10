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
    const sectionFilter = searchParams.get("sectionId");

    // Fetch classes with sections and all students
    const [classes, students] = await Promise.all([
      prisma.class.findMany({
        where: { institutionId },
        include: {
          sections: {
            select: {
              id: true,
              name: true,
              _count: { select: { students: true } },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.user.findMany({
        where: {
          institutionId,
          role: "STUDENT",
          ...(sectionFilter
            ? { sectionId: sectionFilter === "unassigned" ? null : sectionFilter }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          roll: true,
          phone: true,
          sectionId: true,
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ name: "asc" }],
      }),
    ]);

    const unassignedCount = students.filter((s) => !s.sectionId).length;

    return NextResponse.json({
      classes,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        roll: s.roll,
        phone: s.phone,
        sectionId: s.sectionId,
        sectionName: s.section?.name || null,
        classId: s.section?.class?.id || null,
        className: s.section?.class?.name || null,
      })),
      unassignedCount,
    });
  } catch (error) {
    console.error("Error fetching assign student data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    const body = await request.json();
    const { studentId, sectionId } = body;

    if (!studentId || !sectionId) {
      return NextResponse.json(
        { error: "Student and section are required" },
        { status: 400 }
      );
    }

    const student = await prisma.user.findFirst({
      where: { id: studentId, institutionId, role: "STUDENT" },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found in your institution" }, { status: 404 });
    }

    // Verify section belongs to this institution
    const section = await prisma.section.findFirst({
      where: { id: sectionId, class: { institutionId } },
    });
    if (!section) {
      return NextResponse.json({ error: "Section not found in your institution" }, { status: 404 });
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: { sectionId },
      select: {
        id: true,
        name: true,
        email: true,
        roll: true,
        section: {
          select: {
            name: true,
            class: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error("Error assigning student:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) return NextResponse.json({ error: "No institution" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Verify student belongs to this institution
    const student = await prisma.user.findFirst({
      where: { id: studentId, institutionId, role: "STUDENT" },
    });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: studentId },
      data: { sectionId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing student from section:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
