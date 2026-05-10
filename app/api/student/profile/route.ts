import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        institution: { select: { name: true } },
        section: {
          include: {
            class: { select: { name: true } },
            classTeacher: { select: { name: true } },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        roll: student.roll,
        picture: student.picture,
        className: student.section?.class?.name || null,
        sectionName: student.section?.name || null,
        classTeacher: student.section?.classTeacher?.name || null,
        institutionName: student.institution?.name || null,
        joinedAt: student.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
