# ByteEdu School Management System

ByteEdu is a modern, multi-tenant SaaS platform designed to streamline school administration, teaching, and student management. The system is built with a strict role-based access control (RBAC) architecture, ensuring secure data isolation between different institutions (tenants) and user roles.

---

## 👑 SuperAdmin Panel (System Management)
*The SuperAdmin panel is the central command center for the platform owner to manage the entire SaaS ecosystem, oversee institutions, and manage subscription plans.*

### Features:
- **Global Dashboard:** High-level overview of system health, showing total institutions, total revenue, active subscription plans, and recent user signups.
- **Institution Management:** View all registered schools/institutions. SuperAdmins can verify new institutions, suspend accounts, and view the contact details of institution owners.
- **Subscription Plans:** Create, edit, and manage pricing tiers (e.g., Basic, Pro, Enterprise). Define limits for each plan, such as the maximum number of students or teachers an institution can have.
- **Transactions & Billing:** View a comprehensive log of all payments and subscription renewals made by institutions across the platform.
- **System Notices:** Broadcast global announcements that appear on the dashboards of all Admin users across every institution.
- **Global User Management:** Oversee all user accounts in the system (Admins, Teachers, Students) for support and administrative purposes.

---

## 🏫 Admin Panel (Institution Management)
*The Admin panel is used by school principals or administrators to manage their specific institution. All data is strictly isolated to their institution.*

### Features:
- **Institution Dashboard:** Real-time statistics showing total enrolled students, total teachers, total active classes, and today's overall attendance rate.
- **Class & Section Management:** Create academic classes (e.g., "Grade 10") and divide them into multiple sections (e.g., "Section A", "Section B").
- **User Management (Teachers & Students):** Add, edit, and manage teacher and student accounts. View profiles, reset passwords, and oversee enrollment.
  - **Data Export:** Instantly export the complete user directory to CSV for external reporting.
- **Teacher Assignment:** Assign teachers to specific classes and sections. Designate roles such as "Class Teacher" or assign them to specific subjects.
- **Student Assignment:** Enroll and allocate students into their respective classes and sections.
- **Attendance Overview:** Monitor institution-wide daily attendance. Filter records by date, class, and section to identify absentee trends.
  - **Data Export:** Export detailed attendance reports to CSV.
- **Institution Notices:** Publish school-wide announcements that will be visible to all teachers and students within the institution.

---

## 👨‍🏫 Teacher Panel (Academic Management)
*The Teacher panel is tailored for educators to manage their daily classroom activities, primarily focusing on the students and sections assigned to them.*

### Features:
- **Teacher Dashboard:** A personalized overview showing the number of assigned classes, total students under their care, and quick links to daily tasks.
- **My Classes & Sections:** View a list of all assigned classes and sections. Teachers can only access data for the students they are explicitly assigned to teach.
- **Student Roster:** View detailed profiles of students within their assigned sections, including contact information and roll numbers.
- **Daily Attendance Entry:** A streamlined interface to take daily attendance for a specific section. Mark students as Present, Absent, Late, or Excused, with the ability to add optional remarks.
- **Attendance History:** Review past attendance submissions. Filter historical records by date range, section, or attendance status.
  - **Data Export:** Export personal classroom attendance history to CSV for grading or parent-teacher meetings.

---

## 🎓 Student Panel (Coming Soon)
*Currently under development.*
- Will include features such as viewing personal attendance records, class schedules, notices, and academic performance.

---

## 🛠️ Technical Highlights & System Architecture
- **Multi-Tenant Data Isolation:** Every database query is scoped by `institutionId`, ensuring complete privacy and security between different schools.
- **Robust Security:** Double-layer security utilizing NextAuth middleware for route protection and strict backend API role guards (e.g., preventing a Teacher from accessing Admin API endpoints).
- **Modern UI/UX:** 
  - Fully mobile-responsive design with off-canvas sidebars and backdrop overlays.
  - Premium typography (Inter font) and smooth page transition animations.
  - Dynamic breadcrumb navigation for deep links.
  - Skeleton loading states (shimmer effects) to prevent layout shifts during data fetching.
- **Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, Prisma ORM, PostgreSQL, NextAuth.js.