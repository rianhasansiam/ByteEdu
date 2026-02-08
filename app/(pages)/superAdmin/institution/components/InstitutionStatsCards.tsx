"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";

type Props = {
  statusFilter: string;
}

export default function InstitutionStatsCards({ statusFilter }: Props) {
  const stats = useAppSelector((s) => s.institutions.stats);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusClick = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
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
      label: "Total Institutions",
      count: stats.total,
      textColor: "text-gray-900",
      borderColor: "border-black",
      ringColor: "ring-black",
      clickable: true,
    },
    {
      key: "active",
      label: "Active",
      count: stats.active,
      textColor: "text-green-600",
      borderColor: "border-green-500",
      ringColor: "ring-green-500",
      clickable: true,
    },
    {
      key: "inactive",
      label: "Inactive",
      count: stats.inactive,
      textColor: "text-red-600",
      borderColor: "border-red-500",
      ringColor: "ring-red-500",
      clickable: true,
    },
    {
      key: "USERS",
      label: "Total Users",
      count: stats.totalUsers,
      textColor: "text-blue-600",
      borderColor: "border-blue-500",
      ringColor: "ring-blue-500",
      clickable: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const isActive = statusFilter === card.key;

        return (
          <div
            key={card.key}
            className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
              card.clickable ? "cursor-pointer" : ""
            } ${
              isActive
                ? `${card.borderColor} ring-2 ${card.ringColor}`
                : "border-gray-100 hover:border-gray-300"
            }`}
            onClick={() => card.clickable && handleStatusClick(card.key)}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>
              {card.count}
            </p>
          </div>
        );
      })}
    </div>
  );
}
