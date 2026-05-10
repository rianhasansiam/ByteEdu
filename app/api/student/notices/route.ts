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

    const institutionId = session.user.institutionId;

    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        OR: [
          { targetType: "all" },
          ...(institutionId ? [{ targetInstitutionId: institutionId }] : []),
          { targetType: "role", targetRole: "STUDENT" },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        publishedAt: n.publishedAt?.toISOString() || n.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching student notices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
