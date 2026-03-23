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
      // Admin can only see users from their institution
      const adminUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { institutionId: true },
      });

      if (!adminUser?.institutionId) {
        return NextResponse.json(
          { error: "Admin not associated with an institution" },
          { status: 400 }
        );
      }

      whereClause = { institutionId: adminUser.institutionId };
      
      // Filter by role if provided
      if (role && role !== "ALL") {
        whereClause.role = role.toUpperCase();
      }
    } else if (session.user.role === "SUPER_ADMIN") {
      // Super Admin can see all users, optionally filtered by role
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

    // Format the response to match frontend expectations
    const formattedUsers = users.map((user) => ({
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
