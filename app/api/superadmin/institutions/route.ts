import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as InstitutionService from "@/lib/services/superadmin/institutions.service";

/**
 * GET /api/superadmin/institutions
 * Get all institutions with filtering
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
      status: searchParams.get("status") as "active" | "inactive" | "ALL" || undefined,
      sortBy: searchParams.get("sortBy") as "name" | "users" | "latest" || undefined,
    };
    
    const institutions = await InstitutionService.getInstitutions(filters);
    
    return NextResponse.json({ institutions });
  } catch (error) {
    console.error("Error fetching institutions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/superadmin/institutions
 * Create a new institution
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
    
    if (!body.name) {
      return NextResponse.json(
        { error: "Institution name is required" },
        { status: 400 }
      );
    }
    
    const institution = await InstitutionService.createInstitution({
      name: body.name,
      status: body.status,
    });
    
    return NextResponse.json(
      { message: "Institution created successfully", institution },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating institution:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes("already exists") ? 400 : 500 }
    );
  }
}
