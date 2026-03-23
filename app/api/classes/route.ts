import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only allow SUPER_ADMIN, ADMIN, and TEACHER
    if (!["SUPER_ADMIN", "ADMIN", "TEACHER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const institutionId = searchParams.get("institutionId");

    let whereClause = {};

    if (session.user.role === "SUPER_ADMIN") {
      // Super Admin can filter by institutionId or get all
      if (institutionId) {
        whereClause = { institutionId };
      }
    } else {
      // Admin and Teacher can only see classes from their institution
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { institutionId: true },
      });

      if (!user?.institutionId) {
        return NextResponse.json(
          { error: "User not associated with an institution" },
          { status: 400 }
        );
      }

      whereClause = { institutionId: user.institutionId };
    }

    const classes = await prisma.class.findMany({
      where: whereClause,
      include: {
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        sections: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: {
        displayOrder: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        institutionId: c.institutionId,
        institutionName: c.institution.name,
        sections: c.sections,
      })),
    });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
