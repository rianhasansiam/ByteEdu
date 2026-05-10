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
      select: { sectionId: true },
    });

    if (!student?.sectionId) {
      return NextResponse.json({ materials: [] });
    }

    const materials = await prisma.studyMaterial.findMany({
      where: { sectionId: student.sectionId },
      orderBy: { createdAt: "desc" },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } },
      },
    });

    return NextResponse.json({
      materials: materials.map((m) => ({
        id: m.id,
        title: m.title,
        description: m.description,
        fileUrl: m.fileUrl,
        fileType: m.fileType,
        subjectName: m.subject.name,
        teacherName: m.teacher.name,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching study materials:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
