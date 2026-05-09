"use client";

import { useState } from "react";
import CreateClassModal from "./CreateClassModal";

export default function ClassActionsBar({
  institutionId,
  classCount,
}: {
  institutionId: string;
  classCount: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRefresh = () => {
    // Refresh page
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Create Class
      </button>

      <CreateClassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
        institutionId={institutionId}
        existingClasses={classCount}
      />
    </>
  );
}
