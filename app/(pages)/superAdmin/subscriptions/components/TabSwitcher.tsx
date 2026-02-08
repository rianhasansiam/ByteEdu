"use client";

import { useRouter, useSearchParams } from "next/navigation";

type Props = {
  activeTab: string;
}

export default function TabSwitcher({ activeTab }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const switchTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "plans") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    // Clear other filters on tab switch
    for (const key of ["search", "status", "plan", "cycle"]) {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6">
      <button
        onClick={() => switchTab("plans")}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === "plans"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Subscription Plans
      </button>
      <button
        onClick={() => switchTab("tracking")}
        className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
          activeTab === "tracking"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Payment Tracking
      </button>
    </div>
  );
}
