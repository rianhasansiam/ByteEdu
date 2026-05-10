import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;

    if (!institutionId) {
      return NextResponse.json(
        { error: "Admin not associated with an institution" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    // Base where clause: same institution, exclude SUPER_ADMIN
    const whereClause: any = {
      institutionId,
      role: { not: "SUPER_ADMIN" },
    };

    // Role filter — never allow SUPER_ADMIN to be queried
    if (role && role !== "ALL") {
      const upperRole = role.toUpperCase();
      if (upperRole === "SUPER_ADMIN") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      whereClause.role = upperRole;
    }

    // Search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    // Date filter
    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereClause.createdAt.lte = new Date(dateTo + "T23:59:59");
    }

    // Fetch users + stats in parallel
    const [users, stats] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          phone: true,
          picture: true,
          institution: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.groupBy({
        by: ["role"],
        where: { institutionId, role: { not: "SUPER_ADMIN" } },
        _count: { _all: true },
      }),
    ]);

    // Build stats object
    const statsMap: Record<string, number> = {};
    let total = 0;
    stats.forEach((s) => {
      statsMap[s.role] = s._count._all;
      total += s._count._all;
    });

    return NextResponse.json({
      users: users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        phone: user.phone,
        picture: user.picture,
        institution: user.institution?.name || null,
      })),
      total: users.length,
      stats: {
        total,
        admins: statsMap["ADMIN"] || 0,
        teachers: statsMap["TEACHER"] || 0,
        students: statsMap["STUDENT"] || 0,
        users: statsMap["USER"] || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
