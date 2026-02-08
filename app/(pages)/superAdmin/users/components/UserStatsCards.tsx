"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAppSelector } from "@/lib/store/hooks";

type Props = {
  roleFilter: string;
}

export default function UserStatsCardsClient({ roleFilter }: Props) {
  const stats = useAppSelector((s) => s.users.stats);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleRoleClick = (role: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (role === "ALL" || (roleFilter === role && role !== "ALL")) {
      params.delete("role");
    } else {
      params.set("role", role);
    }
    router.push(`?${params.toString()}`);
  };

  const cards = [
    { key: "ALL", label: "Total", count: stats.total, textColor: "text-gray-900", borderColor: "border-black", ringColor: "ring-black" },
    { key: "SUPER_ADMIN", label: "Super Admins", count: stats.superAdmins, textColor: "text-red-600", borderColor: "border-red-500", ringColor: "ring-red-500" },
    { key: "ADMIN", label: "Admins", count: stats.admins, textColor: "text-purple-600", borderColor: "border-purple-500", ringColor: "ring-purple-500" },
    { key: "TEACHER", label: "Teachers", count: stats.teachers, textColor: "text-green-600", borderColor: "border-green-500", ringColor: "ring-green-500" },
    { key: "STUDENT", label: "Students", count: stats.students, textColor: "text-blue-600", borderColor: "border-blue-500", ringColor: "ring-blue-500" },
    { key: "USER", label: "Users", count: stats.users, textColor: "text-gray-600", borderColor: "border-gray-500", ringColor: "ring-gray-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => {
        const isActive = roleFilter === card.key;

        return (
          <div
            key={card.key}
            className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
              isActive
                ? `${card.borderColor} ring-2 ${card.ringColor}`
                : "border-gray-100 hover:border-gray-300"
            }`}
            onClick={() => handleRoleClick(card.key)}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.count}</p>
          </div>
        );
      })}
    </div>
  );
}
