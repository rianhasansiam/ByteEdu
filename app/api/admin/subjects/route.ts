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

    const subjects = await prisma.subject.findMany({
      where: { institutionId },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
