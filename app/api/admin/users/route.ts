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

    // Only allow ADMIN and SUPER_ADMIN
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");

    let whereClause: any = {};

    // Determine which users to fetch based on role
    if (session.user.role === "ADMIN") {
      const institutionId = session.user.institutionId;

      if (!institutionId) {
        return NextResponse.json(
          { error: "Admin not associated with an institution" },
          { status: 400 }
        );
      }

      whereClause = { institutionId };
      
      // Filter by role if provided
      if (role && role !== "ALL") {
        const requestedRole = role.toUpperCase();
        if (requestedRole === "SUPER_ADMIN") {
          return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }
        whereClause.role = requestedRole;
      }
    } else if (session.user.role === "SUPER_ADMIN") {
      if (role && role !== "ALL") {
        whereClause = { role: role.toUpperCase() };
      }
    }

    // Fetch users from database
    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        phone: true,
        picture: true,
        institution: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format and filter - admins cannot see SUPER_ADMIN users
    const formattedUsers = users
      .filter((user) => session.user.role === "SUPER_ADMIN" || user.role !== "SUPER_ADMIN")
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        phone: user.phone,
        picture: user.picture,
        institution: user.institution?.name,
      }));

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
