import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as UserService from "@/lib/services/superadmin/users.service";

/**
 * GET /api/superadmin/users
 * Get users with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      institution: searchParams.get("institution") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      limit: parseInt(searchParams.get("limit") || "50"),
    };
    
    const result = await UserService.getUsers(filters);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/users
 * Create a new user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const body = await request.json();
    
    // Validation
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    
    const user = await UserService.createUser({
      name: body.name,
      email: body.email,
      password: body.password,
      phone: body.phone,
      role: body.role,
      institutionId: body.institutionId,
      picture: body.picture,
      teacherId: body.teacherId,
      sectionId: body.sectionId,
      roll: body.roll,
    });
    
    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes("already exists") ? 400 : 500 }
    );
  }
}
