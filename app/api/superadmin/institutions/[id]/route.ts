import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as InstitutionService from "@/lib/services/superadmin/institutions.service";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/superadmin/institutions/[id]
 * Get a specific institution by ID
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { id } = await params;
    const institution = await InstitutionService.getInstitutionById(id);
    
    if (!institution) {
      return NextResponse.json({ error: "Institution not found" }, { status: 404 });
    }
    
    return NextResponse.json({ institution });
  } catch (error) {
    console.error("Error fetching institution:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/superadmin/institutions/[id]
 * Update an institution
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { id } = await params;
    const body = await request.json();
    
    const institution = await InstitutionService.updateInstitution(id, {
      name: body.name,
      status: body.status,
    });
    
    return NextResponse.json({
      message: "Institution updated successfully",
      institution,
    });
  } catch (error) {
    console.error("Error updating institution:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes("not found") ? 404 : 500 }
    );
  }
}

/**
 * DELETE /api/superadmin/institutions/[id]
 * Delete an institution
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
    
    const { id } = await params;
    await InstitutionService.deleteInstitution(id);
    
    return NextResponse.json({ message: "Institution deleted successfully" });
  } catch (error) {
    console.error("Error deleting institution:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: error instanceof Error && message.includes("Cannot delete") ? 400 : 500 }
    );
  }
}
