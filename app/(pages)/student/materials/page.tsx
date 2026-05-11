"use client";

import { useEffect, useState } from "react";

interface Material {
  id: string; title: string; description: string | null; fileUrl: string | null; fileType: string | null;
  subjectName: string; teacherName: string; createdAt: string;
}

export default function StudentMaterials() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/student/materials")
      .then((r) => r.json())
      .then((d) => setMaterials(d.materials || []))
      .finally(() => setLoading(false));
  }, []);

  const subjects = [...new Set(materials.map((m) => m.subjectName))];
  const filtered = filter ? materials.filter((m) => m.subjectName === filter) : materials;

  const typeIcon: Record<string, string> = {
    pdf: "📄", doc: "📝", image: "🖼️", video: "🎥", link: "🔗",
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Study Materials</h1>
        <p className="text-gray-500 mt-1">Resources shared by your teachers</p>
      </div>

      {/* Subject Filter */}
      {subjects.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button onClick={() => setFilter("")}
            className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${!filter ? "bg-black text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}>
            All
          </button>
          {subjects.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${filter === s ? "bg-black text-white" : "bg-white border text-gray-700 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">No study materials available</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((m) => (
            <div key={m.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl">
                  {typeIcon[m.fileType || ""] || "📎"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{m.title}</h3>
                  <p className="text-sm text-gray-600">{m.subjectName}</p>
                  {m.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{m.description}</p>}
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>{m.teacherName}</span>
                    <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              {m.fileUrl && (
                <a href={m.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
