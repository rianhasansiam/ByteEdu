import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const notices = await prisma.notice.findMany({
      where: {
        OR: [
          { targetInstitutionId: institutionId },
          { targetType: "all" },
          { targetType: "role" },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    const total = notices.length;
    const published = notices.filter((n) => n.isPublished).length;

    return NextResponse.json({
      notices: notices.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        priority: n.priority,
        targetType: n.targetType,
        targetRole: n.targetRole,
        isPublished: n.isPublished,
        publishedAt: n.publishedAt?.toISOString() || null,
        createdAt: n.createdAt.toISOString(),
      })),
      stats: { total, published, draft: total - published },
    });
  } catch (error) {
    console.error("Error fetching notices:", error);
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
    if (!institutionId) return NextResponse.json({ error: "No institution" }, { status: 400 });

    const { title, content, priority, targetType, targetRole, isPublished } = await request.json();
    if (!title || !content) return NextResponse.json({ error: "Title and content required" }, { status: 400 });

    const notice = await prisma.notice.create({
      data: {
        title, content,
        priority: priority || "normal",
        targetType: targetType || "institution",
        targetRole: targetRole || null,
        targetInstitutionId: institutionId,
        isPublished: isPublished || false,
        publishedAt: isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, notice });
  } catch (error) {
    console.error("Error creating notice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const { id, title, content, priority, isPublished } = await request.json();
    if (!id) return NextResponse.json({ error: "Notice ID required" }, { status: 400 });

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      updateData.publishedAt = isPublished ? new Date() : null;
    }

    const notice = await prisma.notice.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true, notice });
  } catch (error) {
    console.error("Error updating notice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Notice ID required" }, { status: 400 });

    await prisma.notice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting notice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
