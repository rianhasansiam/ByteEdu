// ============================================
// USER REPOSITORY — Pure Prisma Data Access
// ============================================

import { prisma } from "@/lib/prisma";
import { Role } from "../../app/generated/prisma/client";

// ---------- READS ----------

export async function findAll() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      picture: true,
      institutionId: true,
      institution: { select: { id: true, name: true } },
      teacherId: true,
      sectionId: true,
      section: { include: { class: true } },
      roll: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function findById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      picture: true,
      institutionId: true,
      institution: { select: { id: true, name: true } },
      teacherId: true,
      sectionId: true,
      section: { include: { class: true } },
      roll: true,
      createdAt: true,
      updatedAt: true,
      classTeacherOf: {
        select: {
          id: true,
          name: true,
          class: { select: { id: true, name: true } },
        },
      },
      teacherAssignments: {
        select: {
          id: true,
          sectionId: true,
          section: {
            select: {
              id: true,
              name: true,
              class: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });
}

export async function findByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getStats() {
  const [total, superAdmins, admins, teachers, students, users] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "TEACHER" } }),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.user.count({ where: { role: "USER" } }),
    ]);
  return { total, superAdmins, admins, teachers, students, users };
}

export async function getUniqueInstitutions() {
  return prisma.institution.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function countByRole(role: Role) {
  return prisma.user.count({ where: { role } });
}

// ---------- WRITES ----------

export async function create(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  institutionId?: string;
  role?: Role;
  picture?: string;
  teacherId?: string;
  sectionId?: string;
  roll?: string;
}) {
  return prisma.user.create({ data: { ...data, role: data.role || "USER" } });
}

export async function update(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    institutionId?: string | null;
    password?: string;
    role?: Role;
    picture?: string;
    sectionId?: string | null;
    roll?: string;
  }
) {
  return prisma.user.update({ where: { id }, data });
}

export async function remove(id: string) {
  return prisma.user.delete({ where: { id } });
}
