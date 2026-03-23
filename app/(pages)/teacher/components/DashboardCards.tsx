"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  color?: "emerald" | "blue" | "amber" | "rose" | "purple";
}

const colorClasses = {
  emerald: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-600",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    text: "text-blue-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    text: "text-amber-600",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "bg-rose-100 text-rose-600",
    text: "text-rose-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-100 text-purple-600",
    text: "text-purple-600",
  },
};

export function StatCard({ title, value, icon, description, color = "emerald" }: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <div className={`${colors.bg} rounded-xl p-6 border border-gray-100`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${colors.text}`}>{value}</p>
          {description && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`${colors.icon} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface AttendanceSummaryProps {
  present: number;
  absent: number;
  late: number;
  excused: number;
}

export function AttendanceSummaryCard({ present, absent, late, excused }: AttendanceSummaryProps) {
  const total = present + absent + late + excused;
  const presentPercentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Today&apos;s Attendance</h3>
      
      {total === 0 ? (
        <p className="text-gray-500 text-sm">No attendance recorded today</p>
      ) : (
        <>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#10b981"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${presentPercentage * 3.52} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-emerald-600">{presentPercentage}%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-sm text-gray-600">Present: {present}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span className="text-sm text-gray-600">Absent: {absent}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span className="text-sm text-gray-600">Late: {late}</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-600">Excused: {excused}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface SectionCardProps {
  section: {
    id: string;
    name: string;
    className: string;
    studentCount: number;
    isClassTeacher?: boolean;
    subjects?: Array<{ id: string; name: string }>;
  };
  onClick?: () => void;
}

export function SectionCard({ section, onClick }: SectionCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all ${
        onClick ? "cursor-pointer hover:border-emerald-300" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-gray-800">
            {section.className} - Section {section.name}
          </h4>
          {section.isClassTeacher && (
            <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full">
              Class Teacher
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600">{section.studentCount}</p>
          <p className="text-xs text-gray-500">Students</p>
        </div>
      </div>
      
      {section.subjects && section.subjects.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {section.subjects.map((subject) => (
            <span
              key={subject.id}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {subject.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
