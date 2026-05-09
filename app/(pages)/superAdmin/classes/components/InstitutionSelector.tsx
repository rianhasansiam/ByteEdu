"use client";

import { useRouter } from "next/navigation";

interface InstitutionOption {
  id: string;
  name: string;
}

interface InstitutionSelectorProps {
  institutions: any[];
  selectedId?: string;
}

export default function InstitutionSelector({
  institutions,
  selectedId,
}: InstitutionSelectorProps) {
  const router = useRouter();

  const handleChange = (institutionId: string) => {
    router.push(`/superAdmin/classes?institutionId=${institutionId}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Select Institution
      </label>
      <select
        value={selectedId || ""}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
      >
        <option value="">Choose an institution...</option>
        {institutions.map((inst: any) => (
          <option key={inst.id} value={inst.id}>
            {inst.name}
          </option>
        ))}
      </select>
    </div>
  );
}
