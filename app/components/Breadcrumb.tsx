"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labelMap: Record<string, string> = {
  admin: "Admin",
  teacher: "Teacher",
  student: "Student",
  superAdmin: "Super Admin",
  dashboard: "Dashboard",
  users: "Users",
  classes: "Classes",
  students: "Students",
  attendance: "Attendance",
  history: "History",
  assignTeacher: "Assign Teacher",
  assignStudent: "Assign Student",
  assignStudents: "Assign Students",
  notice: "Notices",
  notices: "Notices",
  subscription: "Subscription",
  subscriptions: "Subscriptions",
  transaction: "Transactions",
  institution: "Institutions",
  fees: "Fees",
  salary: "Salary",
  inventory: "Inventory",
  profile: "My Profile",
  results: "Results",
  routine: "Class Routine",
  exams: "Exam Schedule",
  assignments: "Assignments",
  materials: "Study Materials",
  notifications: "Notifications",
};

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  // Don't show breadcrumb on root dashboard pages (only 2 segments like /admin/dashboard)
  if (segments.length <= 2) return null;

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return { href, label, isLast };
  });

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4 px-8 pt-4">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-2">
          {i > 0 && (
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          {crumb.isLast ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-gray-700 transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
