import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all classes, sections, subjects for the admin's institution
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    const [classes, subjects, teachers] = await Promise.all([
      prisma.class.findMany({
        where: { institutionId },
        include: {
          sections: {
            include: {
              classTeacher: { select: { id: true, name: true, email: true } },
              _count: { select: { students: true } },
              teacherAssignments: {
                include: {
                  teacher: { select: { id: true, name: true } },
                  subject: { select: { id: true, name: true } },
                },
              },
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { displayOrder: "asc" },
      }),
      prisma.subject.findMany({
        where: { institutionId },
        select: { id: true, name: true, code: true },
        orderBy: { name: "asc" },
      }),
      prisma.user.findMany({
        where: { institutionId, role: "TEACHER" },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ classes, subjects, teachers });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create class, section, or subject
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
    const { type, name, classId, displayOrder, code, classTeacherId } = body;

    if (!type || !name) {
      return NextResponse.json({ error: "type and name are required" }, { status: 400 });
    }

    if (type === "class") {
      const cls = await prisma.class.create({
        data: { institutionId, name, displayOrder: displayOrder || 0 },
      });
      return NextResponse.json({ success: true, data: cls }, { status: 201 });
    }

    if (type === "section") {
      if (!classId) return NextResponse.json({ error: "classId is required" }, { status: 400 });
      // Verify the class belongs to this institution
      const cls = await prisma.class.findFirst({ where: { id: classId, institutionId } });
      if (!cls) return NextResponse.json({ error: "Class not found" }, { status: 404 });

      const section = await prisma.section.create({
        data: { classId, name, classTeacherId: classTeacherId || null },
        include: {
          classTeacher: { select: { id: true, name: true } },
          _count: { select: { students: true } },
        },
      });
      return NextResponse.json({ success: true, data: section }, { status: 201 });
    }

    if (type === "subject") {
      const subject = await prisma.subject.create({
        data: { institutionId, name, code: code || null },
      });
      return NextResponse.json({ success: true, data: subject }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    console.error("Error creating:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Already exists with this name" }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete class, section, or subject
export async function DELETE(request: NextRequest) {
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
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "type and id required" }, { status: 400 });
    }

    if (type === "class") {
      // Verify class belongs to this institution
      const cls = await prisma.class.findFirst({ where: { id, institutionId } });
      if (!cls) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.class.delete({ where: { id } });
    } else if (type === "section") {
      const section = await prisma.section.findFirst({
        where: { id },
        include: { class: { select: { institutionId: true } } },
      });
      if (!section || section.class.institutionId !== institutionId) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      await prisma.section.delete({ where: { id } });
    } else if (type === "subject") {
      const subject = await prisma.subject.findFirst({ where: { id, institutionId } });
      if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
      await prisma.subject.delete({ where: { id } });
    } else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
