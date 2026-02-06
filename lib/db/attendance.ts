"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

// ============================================
// QUERIES (READ)
// ============================================

export const getAttendances = unstable_cache(
  () =>
    prisma.attendance.findMany({
      orderBy: { date: "desc" },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
    }),
  ["attendances"],
  { tags: ["attendances"] }
);

export const getAttendanceById = unstable_cache(
  (id: string) =>
    prisma.attendance.findUnique({
      where: { id },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
    }),
  ["attendance"],
  { tags: ["attendances"] }
);

export const getStudentAttendance = unstable_cache(
  (studentId: string) =>
    prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: "desc" },
    }),
  ["student-attendance"],
  { tags: ["attendances"] }
);

export const getTeacherAttendance = unstable_cache(
  (teacherId: string) =>
    prisma.attendance.findMany({
      where: { teacherId },
      orderBy: { date: "desc" },
    }),
  ["teacher-attendance"],
  { tags: ["attendances"] }
);

export const getAttendanceByDate = unstable_cache(
  (date: Date) =>
    prisma.attendance.findMany({
      where: { date },
      include: {
        student: { include: { user: true } },
        teacher: { include: { user: true } },
      },
    }),
  ["attendance-by-date"],
  { tags: ["attendances"] }
);

// ============================================
// MUTATIONS (WRITE)
// ============================================

export async function createStudentAttendance(data: {
  studentId: string;
  date: Date;
  status: AttendanceStatus;
}) {
  const attendance = await prisma.attendance.create({
    data: {
      studentId: data.studentId,
      date: data.date,
      status: data.status,
    },
  });

  revalidateTag("attendances", "default");
  return attendance;
}

export async function createTeacherAttendance(data: {
  teacherId: string;
  date: Date;
  status: AttendanceStatus;
}) {
  const attendance = await prisma.attendance.create({
    data: {
      teacherId: data.teacherId,
      date: data.date,
      status: data.status,
    },
  });

  revalidateTag("attendances", "default");
  return attendance;
}

export async function updateAttendance(
  id: string,
  data: { status?: AttendanceStatus }
) {
  const attendance = await prisma.attendance.update({
    where: { id },
    data,
  });

  revalidateTag("attendances", "default");
  return attendance;
}

export async function deleteAttendance(id: string) {
  await prisma.attendance.delete({ where: { id } });

  revalidateTag("attendances", "default");
}

// ============================================
// BULK OPERATIONS
// ============================================

export async function createBulkStudentAttendance(
  records: Array<{
    studentId: string;
    date: Date;
    status: AttendanceStatus;
  }>
) {
  const attendances = await prisma.attendance.createMany({
    data: records,
    skipDuplicates: true,
  });

  revalidateTag("attendances", "default");
  return attendances;
}




