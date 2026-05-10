import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const institutionId = session.user.institutionId;
    if (!institutionId) return NextResponse.json({ error: "No institution" }, { status: 400 });

    const teachers = await prisma.user.findMany({
      where: { institutionId, role: "TEACHER" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
