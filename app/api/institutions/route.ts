import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Only SUPER_ADMIN can fetch all institutions
    // ADMIN gets only their own institution
    if (session.user.role === "SUPER_ADMIN") {
      const institutions = await prisma.institution.findMany({
        select: {
          id: true,
          name: true,
          status: true,
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({ institutions });
    }

    if (session.user.role === "ADMIN") {
      // Return the admin's institution only
      if (!session.user.institutionId) {
        return NextResponse.json({ institutions: [] });
      }

      const institution = await prisma.institution.findUnique({
        where: { id: session.user.institutionId },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

      return NextResponse.json({
        institutions: institution ? [institution] : [],
      });
    }

    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  } catch (error) {
    console.error("Failed to fetch institutions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
