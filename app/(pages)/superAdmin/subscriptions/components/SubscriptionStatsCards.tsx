"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";

type Props = {
  statusFilter: string;
}

export default function SubscriptionStatsCards({ statusFilter }: Props) {
  const stats = useAppSelector((s) => s.subscriptions.stats);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusClick = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "tracking");
    if (status === "ALL" || statusFilter === status) {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`?${params.toString()}`);
  };

  const cards = [
    {
      key: "ALL",
      label: "Total",
      count: stats.total,
      subtext: `৳${stats.totalRevenue.toLocaleString()} revenue`,
      textColor: "text-gray-900",
      borderColor: "border-black",
      ringColor: "ring-black",
    },
    {
      key: "paid",
      label: "Paid",
      count: stats.paid,
      subtext: `৳${stats.paidAmount.toLocaleString()}`,
      textColor: "text-green-600",
      borderColor: "border-green-500",
      ringColor: "ring-green-500",
    },
    {
      key: "due",
      label: "Due",
      count: stats.due,
      subtext: `৳${stats.dueAmount.toLocaleString()}`,
      textColor: "text-yellow-600",
      borderColor: "border-yellow-500",
      ringColor: "ring-yellow-500",
    },
    {
      key: "overdue",
      label: "Overdue",
      count: stats.overdue,
      subtext: "Action needed",
      textColor: "text-red-600",
      borderColor: "border-red-500",
      ringColor: "ring-red-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const isActive = statusFilter === card.key;

        return (
          <div
            key={card.key}
            className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
              isActive
                ? `${card.borderColor} ring-2 ${card.ringColor}`
                : "border-gray-100 hover:border-gray-300"
            }`}
            onClick={() => handleStatusClick(card.key)}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>
              {card.count}
            </p>
            <p className="text-xs text-gray-400 mt-1">{card.subtext}</p>
          </div>
        );
      })}
    </div>
  );
}
