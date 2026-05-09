import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const institutionId = session.user.institutionId;
    if (!institutionId) {
      return NextResponse.json({ error: "No institution" }, { status: 400 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { institutionId },
      include: {
        plan: {
          select: { id: true, name: true, price: true, billingCycle: true, features: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const currentSub = subscriptions.find(
      (s) => new Date(s.endDate) >= new Date() && s.paymentStatus === "paid"
    ) || subscriptions[0] || null;

    return NextResponse.json({
      current: currentSub
        ? {
            id: currentSub.id,
            planName: currentSub.plan.name,
            planPrice: currentSub.plan.price,
            features: currentSub.plan.features,
            amount: currentSub.amount,
            billingCycle: currentSub.billingCycle,
            paymentStatus: currentSub.paymentStatus,
            startDate: currentSub.startDate.toISOString(),
            endDate: currentSub.endDate.toISOString(),
            paidAt: currentSub.paidAt?.toISOString() || null,
          }
        : null,
      history: subscriptions.map((s) => ({
        id: s.id,
        planName: s.plan.name,
        amount: s.amount,
        billingCycle: s.billingCycle,
        paymentStatus: s.paymentStatus,
        startDate: s.startDate.toISOString(),
        endDate: s.endDate.toISOString(),
        paidAt: s.paidAt?.toISOString() || null,
        transactionId: s.transactionId,
      })),
    });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
