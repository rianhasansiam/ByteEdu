import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  updatePlan,
  deletePlan,
  togglePlanStatus 
} from '@/lib/services/superadmin';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    
    // Check if this is a toggle status request
    if (body.toggleStatus) {
      const plan = await togglePlanStatus(id);
      return NextResponse.json(plan);
    }
    
    const plan = await updatePlan(id, body);

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    await deletePlan(id);

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
