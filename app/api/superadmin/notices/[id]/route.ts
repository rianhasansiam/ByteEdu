import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getNoticeById, 
  updateNotice,
  deleteNotice,
  toggleNoticePublish 
} from '@/lib/services/superadmin';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const notice = await getNoticeById(id);

    if (!notice) {
      return NextResponse.json(
        { error: 'Notice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(notice);
  } catch (error) {
    console.error('Error fetching notice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notice' },
      { status: 500 }
    );
  }
}

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
    
    // Check if this is a toggle publish request
    if (body.togglePublish) {
      const notice = await toggleNoticePublish(id);
      return NextResponse.json(notice);
    }
    
    const notice = await updateNotice(id, body);

    return NextResponse.json(notice);
  } catch (error) {
    console.error('Error updating notice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update notice' },
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
    await deleteNotice(id);

    return NextResponse.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Error deleting notice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete notice' },
      { status: 500 }
    );
  }
}
