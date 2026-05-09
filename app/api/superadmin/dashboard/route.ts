import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getDashboardStats, 
  getRecentActivity 
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
    const includeActivity = searchParams.get('includeActivity') !== 'false';
    const activityLimit = parseInt(searchParams.get('activityLimit') || '10');

    const stats = await getDashboardStats();
    
    let activity = null;
    if (includeActivity) {
      activity = await getRecentActivity(activityLimit);
    }

    return NextResponse.json({
      stats,
      activity,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
