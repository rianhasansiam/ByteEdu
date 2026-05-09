import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");

    const whereClause: any = {};

    if (status && status !== "all") {
      whereClause.paymentStatus = status;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) whereClause.createdAt.gte = new Date(dateFrom);
      if (dateTo) whereClause.createdAt.lte = new Date(dateTo + "T23:59:59");
    }

    if (search) {
      whereClause.OR = [
        { institution: { name: { contains: search, mode: "insensitive" } } },
        { transactionId: { contains: search, mode: "insensitive" } },
        { plan: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [subscriptions, stats] = await Promise.all([
      prisma.subscription.findMany({
        where: whereClause,
        include: {
          institution: { select: { id: true, name: true } },
          plan: { select: { id: true, name: true, price: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.subscription.aggregate({
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Compute stats
    const totalRevenue = subscriptions
      .filter((s) => s.paymentStatus === "paid")
      .reduce((sum, s) => sum + s.amount, 0);

    const totalDue = subscriptions
      .filter((s) => s.paymentStatus === "due" || s.paymentStatus === "overdue")
      .reduce((sum, s) => sum + s.amount, 0);

    const paidCount = subscriptions.filter((s) => s.paymentStatus === "paid").length;
    const dueCount = subscriptions.filter((s) => s.paymentStatus === "due").length;
    const overdueCount = subscriptions.filter((s) => s.paymentStatus === "overdue").length;

    return NextResponse.json({
      transactions: subscriptions.map((s) => ({
        id: s.id,
        institutionId: s.institution.id,
        institutionName: s.institution.name,
        planName: s.plan.name,
        planPrice: s.plan.price,
        amount: s.amount,
        billingCycle: s.billingCycle,
        paymentStatus: s.paymentStatus,
        transactionId: s.transactionId,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        paidAt: s.paidAt?.toISOString() || null,
        notes: s.notes,
        createdAt: s.createdAt.toISOString(),
      })),
      stats: {
        totalRevenue,
        totalDue,
        totalTransactions: subscriptions.length,
        paidCount,
        dueCount,
        overdueCount,
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Mark a subscription as paid
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { id, paymentStatus, transactionId, notes } = await request.json();
    if (!id) return NextResponse.json({ error: "Subscription ID required" }, { status: 400 });

    const updateData: any = {};
    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
      if (paymentStatus === "paid") {
        updateData.paidAt = new Date();
      }
    }
    if (transactionId !== undefined) updateData.transactionId = transactionId;
    if (notes !== undefined) updateData.notes = notes;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        institution: { select: { name: true } },
        plan: { select: { name: true } },
      },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
