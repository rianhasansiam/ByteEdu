"use server";

import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CACHE_TAGS } from "@/lib/cache-tags";

// ============================================
// QUERIES (READ)
// ============================================

export const getClassesByInstitution = async (institutionId: string) => {
  return await prisma.class.findMany({
    where: { institutionId },
    include: {
      sections: {
        include: {
          classTeacher: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: { students: true },
          },
        },
        orderBy: { name: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });
};

export const getSectionsByClass = async (classId: string) => {
  return await prisma.section.findMany({
    where: { classId },
    include: {
      classTeacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: {
        select: {
          name: true,
        },
      },
      _count: {
        select: { students: true },
      },
    },
    orderBy: { name: "asc" },
  });
};

export const getAvailableTeachers = async (institutionId: string) => {
  return await prisma.user.findMany({
    where: {
      institutionId,
      role: "TEACHER",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: { name: "asc" },
  });
};

// ============================================
// MUTATIONS (CREATE, UPDATE, DELETE)
// ============================================

export const createClass = async (
  institutionId: string,
  name: string,
  displayOrder: number
) => {
  const result = await prisma.class.create({
    data: {
      institutionId,
      name,
      displayOrder,
    },
  });

  // Invalidate cache
  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

export const updateClass = async (
  classId: string,
  name: string,
  displayOrder: number
) => {
  const result = await prisma.class.update({
    where: { id: classId },
    data: { name, displayOrder },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

export const deleteClass = async (classId: string) => {
  const result = await prisma.class.delete({
    where: { id: classId },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

export const createSection = async (
  classId: string,
  name: string,
  classTeacherId?: string
) => {
  const result = await prisma.section.create({
    data: {
      classId,
      name,
      classTeacherId: classTeacherId || null,
    },
    include: {
      classTeacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: {
        select: {
          name: true,
        },
      },
      _count: {
        select: { students: true },
      },
    },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

export const updateSection = async (
  sectionId: string,
  name: string,
  classTeacherId?: string
) => {
  const result = await prisma.section.update({
    where: { id: sectionId },
    data: {
      name,
      classTeacherId: classTeacherId || null,
    },
    include: {
      classTeacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      class: {
        select: {
          name: true,
        },
      },
      _count: {
        select: { students: true },
      },
    },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

export const deleteSection = async (sectionId: string) => {
  const result = await prisma.section.delete({
    where: { id: sectionId },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

// ============================================
// STUDENT ASSIGNMENTS
// ============================================

export const getStudentsByInstitution = async (institutionId: string) => {
  return await prisma.user.findMany({
    where: {
      institutionId,
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      roll: true,
      sectionId: true,
      section: {
        select: {
          id: true,
          name: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });
};

export const getStudentsBySection = async (sectionId: string) => {
  return await prisma.user.findMany({
    where: {
      sectionId,
      role: "STUDENT",
    },
    select: {
      id: true,
      name: true,
      email: true,
      roll: true,
    },
    orderBy: { name: "asc" },
  });
};

export const assignStudentToSection = async (
  studentId: string,
  sectionId: string
) => {
  const result = await prisma.user.update({
    where: { id: studentId },
    data: { sectionId },
    select: {
      id: true,
      name: true,
      email: true,
      roll: true,
      section: {
        select: {
          id: true,
          name: true,
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

export const removeStudentFromSection = async (studentId: string) => {
  const result = await prisma.user.update({
    where: { id: studentId },
    data: { sectionId: null },
    select: {
      id: true,
      name: true,
      email: true,
      roll: true,
    },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

// ============================================
// TEACHER ASSIGNMENTS
// ============================================

export const getSubjectsByInstitution = async (institutionId: string) => {
  return await prisma.subject.findMany({
    where: { institutionId },
    select: {
      id: true,
      name: true,
      code: true,
    },
    orderBy: { name: "asc" },
  });
};

export const getTeacherAssignmentsBySection = async (sectionId: string) => {
  return await prisma.teacherAssignment.findMany({
    where: { sectionId },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const assignTeacherToSection = async (
  teacherId: string,
  sectionId: string,
  subjectId: string
) => {
  const result = await prisma.teacherAssignment.create({
    data: {
      teacherId,
      sectionId,
      subjectId,
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};

export const removeTeacherFromSection = async (assignmentId: string) => {
  const result = await prisma.teacherAssignment.delete({
    where: { id: assignmentId },
  });

  revalidateTag(CACHE_TAGS.classes, { expire: 0 });

  return result;
};
