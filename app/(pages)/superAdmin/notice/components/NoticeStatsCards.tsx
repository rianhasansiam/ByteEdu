"use client";

import { useAppSelector } from "@/lib/store/hooks";

type Props = {
  statusFilter: string;
};

export default function NoticeStatsCards({ statusFilter }: Props) {
  const stats = useAppSelector((s) => s.notices.stats);
  const cards = [
    {
      label: "Total Notices",
      value: stats.total,
      color: "text-gray-900",
      active: statusFilter === "ALL",
    },
    {
      label: "Published",
      value: stats.published,
      color: "text-green-600",
      active: statusFilter === "published",
    },
    {
      label: "Drafts",
      value: stats.draft,
      color: "text-gray-600",
      active: statusFilter === "draft",
    },
    {
      label: "High / Urgent",
      value: stats.highPriority + stats.urgent,
      color: "text-red-600",
      active: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`bg-white rounded-xl shadow-sm border p-6 ${
            card.active ? "border-black" : "border-gray-100"
          }`}
        >
          <p className="text-sm font-medium text-gray-500">{card.label}</p>
          <p className={`text-2xl font-bold mt-1 ${card.color}`}>
            {card.value}
          </p>
        </div>
      ))}
    </div>
  );
}
