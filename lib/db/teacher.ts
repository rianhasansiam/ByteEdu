"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "../../app/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache-tags";

// ============================================
// TEACHER QUERIES
// ============================================

/**
 * Get teacher profile with all assignments and institution info
 */
export const getTeacherProfile = unstable_cache(
  async (teacherId: string) => {
    return prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        picture: true,
        teacherId: true,
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        teacherAssignments: {
          include: {
            section: {
              include: {
                class: true,
              },
            },
            subject: true,
          },
        },
        classTeacherOf: {
          include: {
            class: true,
            _count: {
              select: { students: true },
            },
          },
        },
      },
    });
  },
  ["teacher-profile"],
  { tags: [CACHE_TAGS.users] }
);

/**
 * Get dashboard stats for teacher
 */
export const getTeacherDashboardStats = unstable_cache(
  async (teacherId: string, institutionId: string) => {
    // Get sections where teacher is assigned (either as class teacher or subject teacher)
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        classTeacherOf: {
          select: { id: true },
        },
        teacherAssignments: {
          select: {
            sectionId: true,
          },
        },
      },
    });

    if (!teacher) {
      return null;
    }

    // Get unique section IDs
    const classTeacherSectionIds = teacher.classTeacherOf.map((s) => s.id);
    const assignedSectionIds = teacher.teacherAssignments.map((a) => a.sectionId);
    const allSectionIds = [...new Set([...classTeacherSectionIds, ...assignedSectionIds])];

    // Count students in assigned sections within the same institution
    const totalStudents = await prisma.user.count({
      where: {
        role: "STUDENT",
        institutionId: institutionId,
        sectionId: { in: allSectionIds },
      },
    });

    // Get today's attendance summary
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await prisma.attendance.groupBy({
      by: ["status"],
      where: {
        teacherId: teacherId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _count: true,
    });

    const attendanceSummary = {
      present: todayAttendance.find((a) => a.status === "PRESENT")?._count || 0,
      absent: todayAttendance.find((a) => a.status === "ABSENT")?._count || 0,
      late: todayAttendance.find((a) => a.status === "LATE")?._count || 0,
      excused: todayAttendance.find((a) => a.status === "EXCUSED")?._count || 0,
    };

    // Count assigned classes/sections
    const totalAssignedSections = allSectionIds.length;
    const totalSubjects = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      select: { subjectId: true },
      distinct: ["subjectId"],
    });

    return {
      totalStudents,
      attendanceSummary,
      totalAssignedSections,
      totalSubjects: totalSubjects.length,
      isClassTeacher: classTeacherSectionIds.length > 0,
    };
  },
  ["teacher-dashboard-stats"],
  { tags: [CACHE_TAGS.attendance, CACHE_TAGS.users] }
);

/**
 * Get sections where teacher is class teacher
 */
export const getClassTeacherSections = unstable_cache(
  async (teacherId: string) => {
    return prisma.section.findMany({
      where: {
        classTeacherId: teacherId,
      },
      include: {
        class: true,
        _count: {
          select: { students: true },
        },
      },
    });
  },
  ["class-teacher-sections"],
  { tags: [CACHE_TAGS.sections] }
);

/**
 * Get all sections assigned to teacher (subject teaching)
 */
export const getTeacherAssignedSections = unstable_cache(
  async (teacherId: string) => {
    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      include: {
        section: {
          include: {
            class: true,
            _count: {
              select: { students: true },
            },
          },
        },
        subject: true,
      },
    });

    return assignments;
  },
  ["teacher-assigned-sections"],
  { tags: [CACHE_TAGS.sections] }
);

/**
 * Get students in a specific section (with institution isolation)
 */
export const getStudentsBySection = unstable_cache(
  async (
    sectionId: string,
    institutionId: string,
    page: number = 1,
    limit: number = 20
  ) => {
    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          sectionId: sectionId,
          institutionId: institutionId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          roll: true,
          phone: true,
          picture: true,
          section: {
            include: {
              class: true,
            },
          },
        },
        orderBy: [{ roll: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: {
          role: "STUDENT",
          sectionId: sectionId,
          institutionId: institutionId,
        },
      }),
    ]);

    return {
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  ["students-by-section"],
  { tags: [CACHE_TAGS.users] }
);

/**
 * Get all students accessible to teacher (from assigned sections)
 */
export const getTeacherStudents = unstable_cache(
  async (
    teacherId: string,
    institutionId: string,
    page: number = 1,
    limit: number = 20,
    sectionId?: string
  ) => {
    // Get all section IDs teacher has access to
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        classTeacherOf: { select: { id: true } },
        teacherAssignments: { select: { sectionId: true } },
      },
    });

    if (!teacher) return null;

    const classTeacherSectionIds = teacher.classTeacherOf.map((s) => s.id);
    const assignedSectionIds = teacher.teacherAssignments.map((a) => a.sectionId);
    const allSectionIds = [...new Set([...classTeacherSectionIds, ...assignedSectionIds])];

    // Filter by specific section if provided
    const filterSectionIds = sectionId ? [sectionId] : allSectionIds;

    // Validate that the requested section is accessible
    if (sectionId && !allSectionIds.includes(sectionId)) {
      return null; // Teacher doesn't have access to this section
    }

    const skip = (page - 1) * limit;

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "STUDENT",
          sectionId: { in: filterSectionIds },
          institutionId: institutionId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          roll: true,
          phone: true,
          picture: true,
          section: {
            include: {
              class: true,
            },
          },
        },
        orderBy: [{ section: { class: { name: "asc" } } }, { roll: "asc" }, { name: "asc" }],
        skip,
        take: limit,
      }),
      prisma.user.count({
        where: {
          role: "STUDENT",
          sectionId: { in: filterSectionIds },
          institutionId: institutionId,
        },
      }),
    ]);

    return {
      students,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  ["teacher-students"],
  { tags: [CACHE_TAGS.users] }
);

/**
 * Get student details with attendance history
 */
export const getStudentDetails = unstable_cache(
  async (studentId: string, institutionId: string) => {
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
        institutionId: institutionId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        roll: true,
        phone: true,
        picture: true,
        section: {
          include: {
            class: true,
          },
        },
        studentAttendances: {
          orderBy: { date: "desc" },
          take: 30,
          select: {
            id: true,
            date: true,
            status: true,
            remarks: true,
          },
        },
      },
    });

    return student;
  },
  ["student-details"],
  { tags: [CACHE_TAGS.users, CACHE_TAGS.attendance] }
);

// ============================================
// ATTENDANCE QUERIES
// ============================================

/**
 * Get attendance for a section on a specific date
 */
export const getAttendanceByDateAndSection = unstable_cache(
  async (sectionId: string, date: Date) => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return prisma.attendance.findMany({
      where: {
        sectionId,
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            roll: true,
          },
        },
      },
      orderBy: {
        student: { roll: "asc" },
      },
    });
  },
  ["attendance-by-date-section"],
  { tags: [CACHE_TAGS.attendance] }
);

/**
 * Get attendance history with filters
 */
export const getAttendanceHistory = unstable_cache(
  async (
    teacherId: string,
    sectionId?: string,
    studentId?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 50
  ) => {
    const skip = (page - 1) * limit;

    const where: {
      teacherId: string;
      sectionId?: string;
      studentId?: string;
      date?: { gte?: Date; lte?: Date };
    } = {
      teacherId,
    };

    if (sectionId) where.sectionId = sectionId;
    if (studentId) where.studentId = studentId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        include: {
          student: {
            select: {
              id: true,
              name: true,
              roll: true,
            },
          },
          section: {
            include: {
              class: true,
            },
          },
        },
        orderBy: [{ date: "desc" }, { student: { roll: "asc" } }],
        skip,
        take: limit,
      }),
      prisma.attendance.count({ where }),
    ]);

    return {
      records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
  ["attendance-history"],
  { tags: [CACHE_TAGS.attendance] }
);

/**
 * Check if attendance already exists for a section on a date
 */
export async function checkAttendanceExists(sectionId: string, date: Date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const count = await prisma.attendance.count({
    where: {
      sectionId,
      date: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  return count > 0;
}

// ============================================
// ATTENDANCE MUTATIONS
// ============================================

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

/**
 * Submit attendance for a section
 */
export async function submitAttendance(
  teacherId: string,
  sectionId: string,
  date: Date,
  records: AttendanceRecord[]
) {
  // Normalize date to start of day
  const attendanceDate = new Date(date);
  attendanceDate.setHours(0, 0, 0, 0);

  // Use upsert to handle both new and update scenarios
  const operations = records.map((record) =>
    prisma.attendance.upsert({
      where: {
        studentId_date_sectionId: {
          studentId: record.studentId,
          date: attendanceDate,
          sectionId: sectionId,
        },
      },
      create: {
        studentId: record.studentId,
        teacherId: teacherId,
        sectionId: sectionId,
        date: attendanceDate,
        status: record.status,
        remarks: record.remarks,
      },
      update: {
        status: record.status,
        remarks: record.remarks,
        teacherId: teacherId,
      },
    })
  );

  const result = await prisma.$transaction(operations);

  // Invalidate cache
  revalidateTag(CACHE_TAGS.attendance, { expire: 0 });

  return result;
}

/**
 * Update single attendance record
 */
export async function updateAttendanceRecord(
  id: string,
  teacherId: string,
  data: {
    status?: AttendanceStatus;
    remarks?: string;
  }
) {
  const attendance = await prisma.attendance.update({
    where: { id },
    data: {
      ...data,
      teacherId, // Update who made the change
    },
  });

  revalidateTag(CACHE_TAGS.attendance, { expire: 0 });

  return attendance;
}

// ============================================
// STUDENT MARKS (Optional Feature)
// ============================================

export async function addStudentMark(data: {
  studentId: string;
  subjectId: string;
  marks?: number;
  maxMarks?: number;
  examType?: string;
  notes?: string;
  date?: Date;
}) {
  const mark = await prisma.studentMark.create({
    data: {
      studentId: data.studentId,
      subjectId: data.subjectId,
      marks: data.marks,
      maxMarks: data.maxMarks || 100,
      examType: data.examType || "exam",
      notes: data.notes,
      date: data.date || new Date(),
    },
  });

  return mark;
}

export const getStudentMarks = unstable_cache(
  async (studentId: string, subjectId?: string) => {
    return prisma.studentMark.findMany({
      where: {
        studentId,
        ...(subjectId && { subjectId }),
      },
      include: {
        subject: true,
      },
      orderBy: { date: "desc" },
    });
  },
  ["student-marks"],
  { tags: [CACHE_TAGS.users] }
);
