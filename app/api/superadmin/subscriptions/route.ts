import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  getSubscriptions, 
  createSubscription 
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const paymentStatus = searchParams.get('paymentStatus') || undefined;
    const planId = searchParams.get('planId') || undefined;
    const cycle = searchParams.get('cycle') || undefined;

    const result = await getSubscriptions({
      search,
      status: status as any,
      planId,
      cycle,
    });

    // Handle pagination manually since service doesn't include it
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = result.slice(startIndex, endIndex);

    return NextResponse.json({
      data: paginatedData,
      pagination: {
        page,
        limit,
        total: result.length,
        totalPages: Math.ceil(result.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
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
    const subscription = await createSubscription(body);

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
