import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getNotices, 
  createNotice 
} from '@/lib/services/superadmin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const priority = searchParams.get('priority') || undefined;
    const targetType = searchParams.get('targetType') || undefined;
    const targetRole = searchParams.get('targetRole') || undefined;
    const status = searchParams.get('status') || undefined;

    const notices = await getNotices({
      search,
      priority: priority as any,
      targetType: targetType as any,
      targetRole: targetRole as any,
      status: status as any,
    });

    return NextResponse.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const notice = await createNotice(body);

    return NextResponse.json(notice, { status: 201 });
  } catch (error) {
    console.error('Error creating notice:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create notice' },
      { status: 500 }
    );
  }
}
