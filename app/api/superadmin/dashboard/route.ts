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

    const rawStats = await getDashboardStats();
    
    // Transform flat service stats into the nested shape the frontend expects
    const stats = {
      users: {
        total: rawStats.totalUsers ?? 0,
        admins: rawStats.totalAdmins ?? 0,
        teachers: rawStats.totalTeachers ?? 0,
        students: rawStats.totalStudents ?? 0,
        superAdmins: 0,
        newThisMonth: 0,
      },
      institutions: {
        total: rawStats.totalInstitutions ?? 0,
        active: rawStats.activeInstitutions ?? 0,
        inactive: (rawStats.totalInstitutions ?? 0) - (rawStats.activeInstitutions ?? 0),
        newThisMonth: 0,
      },
      subscriptions: {
        total: rawStats.totalSubscriptions ?? 0,
        paid: rawStats.paidSubscriptions ?? 0,
        due: rawStats.dueSubscriptions ?? 0,
        overdue: rawStats.overdueSubscriptions ?? 0,
        totalRevenue: rawStats.totalRevenue ?? 0,
        paidAmount: rawStats.paidAmount ?? 0,
        dueAmount: rawStats.dueAmount ?? 0,
      },
      notices: {
        total: rawStats.totalNotices ?? 0,
        published: rawStats.publishedNotices ?? 0,
        draft: (rawStats.totalNotices ?? 0) - (rawStats.publishedNotices ?? 0),
        highPriority: 0,
        urgent: 0,
      },
    };
    
    let activity = null;
    if (includeActivity) {
      const rawActivity = await getRecentActivity(activityLimit);
      // Transform service activity items into the shape the frontend expects
      activity = (rawActivity || []).map((item) => {
        // Map service types (e.g. "user_created") to UI types (e.g. "user")
        const typeMap: Record<string, 'user' | 'institution' | 'subscription' | 'notice'> = {
          user_created: 'user',
          institution_created: 'institution',
          subscription_created: 'subscription',
          notice_published: 'notice',
        };
        return {
          id: item.id,
          type: typeMap[item.type] || 'user',
          action: item.message,
          description: item.meta ? Object.values(item.meta).join(' · ') : '',
          timestamp: item.timestamp,
          metadata: item.meta,
        };
      });
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
