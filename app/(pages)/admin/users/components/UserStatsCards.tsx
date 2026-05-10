"use client";

import { UserStats } from "./types";

type Props = {
  stats: UserStats;
  activeRole: string;
  onRoleClick: (role: string) => void;
};

export default function AdminUserStatsCards({ stats, activeRole, onRoleClick }: Props) {
  const cards = [
    { key: "ALL", label: "Total", count: stats.total, textColor: "text-gray-900", borderColor: "border-black", ringColor: "ring-black" },
    { key: "ADMIN", label: "Admins", count: stats.admins, textColor: "text-purple-600", borderColor: "border-purple-500", ringColor: "ring-purple-500" },
    { key: "TEACHER", label: "Teachers", count: stats.teachers, textColor: "text-green-600", borderColor: "border-green-500", ringColor: "ring-green-500" },
    { key: "STUDENT", label: "Students", count: stats.students, textColor: "text-blue-600", borderColor: "border-blue-500", ringColor: "ring-blue-500" },
    { key: "USER", label: "Users", count: stats.users, textColor: "text-gray-600", borderColor: "border-gray-500", ringColor: "ring-gray-500" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => {
        const isActive = activeRole === card.key;
        return (
          <div
            key={card.key}
            className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${
              isActive
                ? `${card.borderColor} ring-2 ${card.ringColor}`
                : "border-gray-100 hover:border-gray-300"
            }`}
            onClick={() => onRoleClick(card.key)}
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.count}</p>
          </div>
        );
      })}
    </div>
  );
}
