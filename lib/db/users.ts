"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache-tags";

// ============================================
// QUERIES (READ) - with cache tags
// ============================================

export const getAllUsers = unstable_cache(
  async () => {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        institution: true,
        role: true,
        picture: true,
        teacherId: true,
        class: true,
        section: true,
        roll: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },
  ["all-users"],
  { tags: [CACHE_TAGS.users] }
);

export const getUserById = unstable_cache(
  async (id: string) => {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        institution: true,
        role: true,
        picture: true,
        teacherId: true,
        class: true,
        section: true,
        roll: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
  ["user-by-id"],
  { tags: [CACHE_TAGS.users] }
);

export const getUserByEmail = unstable_cache(
  async (email: string) => {
    return prisma.user.findUnique({
      where: { email },
    });
  },
  ["user-by-email"],
  { tags: [CACHE_TAGS.users] }
);

export const getUniqueInstitutions = unstable_cache(
  async () => {
    const users = await prisma.user.findMany({
      where: {
        institution: { not: null },
      },
      select: { institution: true },
      distinct: ["institution"],
    });
    return users.map((u) => u.institution).filter(Boolean) as string[];
  },
  ["unique-institutions"],
  { tags: [CACHE_TAGS.userInstitutions, CACHE_TAGS.users] }
);

export const getUserStats = unstable_cache(
  async () => {
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
  },
  ["user-stats"],
  { tags: [CACHE_TAGS.userStats, CACHE_TAGS.users] }
);

// ============================================
// MUTATIONS (WRITE) - with revalidateTag
// ============================================

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  institution?: string;
  role?: Role;
  picture?: string;
  teacherId?: string;
  class?: string;
  section?: string;
  roll?: string;
}) {
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      institution: data.institution,
      role: data.role || "USER",
      picture: data.picture,
      teacherId: data.teacherId,
      class: data.class,
      section: data.section,
      roll: data.roll,
    },
  });

  // Revalidate all user-related caches
  revalidateTag(CACHE_TAGS.users, "default");
  revalidateTag(CACHE_TAGS.userStats, "default");
  revalidateTag(CACHE_TAGS.userInstitutions, "default");

  return user;
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    institution?: string;
    password?: string;
    role?: Role;
    picture?: string;
  }
) {
  const user = await prisma.user.update({
    where: { id },
    data,
  });

  // Revalidate all user-related caches
  revalidateTag(CACHE_TAGS.users, "default");
  revalidateTag(CACHE_TAGS.userStats, "default");
  revalidateTag(CACHE_TAGS.userInstitutions, "default");

  return user;
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  });

  // Revalidate all user-related caches
  revalidateTag(CACHE_TAGS.users, "default");
  revalidateTag(CACHE_TAGS.userStats, "default");
  revalidateTag(CACHE_TAGS.userInstitutions, "default");
}

export async function updateUserRole(id: string, role: Role) {
  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });

  // Revalidate all user-related caches
  revalidateTag(CACHE_TAGS.users, "default");
  revalidateTag(CACHE_TAGS.userStats, "default");

  return user;
}
