"use client";

import { useEffect, useState } from "react";

interface Profile {
  id: string; name: string; email: string; phone: string | null; roll: string | null;
  picture: string | null; className: string | null; sectionName: string | null;
  classTeacher: string | null; institutionName: string | null; joinedAt: string;
}

export default function StudentProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => r.json())
      .then((d) => setProfile(d.profile))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) return <div className="p-8 text-gray-500">Failed to load profile.</div>;

  const fields = [
    { label: "Full Name", value: profile.name },
    { label: "Email", value: profile.email },
    { label: "Phone", value: profile.phone || "—" },
    { label: "Roll Number", value: profile.roll || "—" },
    { label: "Class", value: profile.className || "Not assigned" },
    { label: "Section", value: profile.sectionName || "Not assigned" },
    { label: "Class Teacher", value: profile.classTeacher || "—" },
    { label: "Institution", value: profile.institutionName || "—" },
    { label: "Admission Date", value: new Date(profile.joinedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Your personal and academic information</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 p-8 text-white">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.name}</h2>
              <p className="text-indigo-100 mt-1">
                {profile.className && profile.sectionName
                  ? `${profile.className} - Section ${profile.sectionName}`
                  : "Class not assigned"}
              </p>
              {profile.roll && <p className="text-indigo-200 text-sm mt-0.5">Roll: {profile.roll}</p>}
            </div>
          </div>
        </div>

        {/* Fields */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            {fields.map((field) => (
              <div key={field.label}>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{field.label}</p>
                <p className="text-gray-900 font-medium">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
