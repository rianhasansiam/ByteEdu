import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const sections = await prisma.teacherAssignment.findMany({
      where: { teacherId: session.user.id },
      include: {
        section: {
          include: { class: { select: { name: true } } },
        },
        subject: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Error fetching teacher sections:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
