"use server";

import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Role } from "../../app/generated/prisma/client";
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
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        role: true,
        picture: true,
        teacherId: true,
        sectionId: true,
        section: {
          include: {
            class: true,
          },
        },
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
        institutionId: true,
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        role: true,
        picture: true,
        teacherId: true,
        sectionId: true,
        section: {
          include: {
            class: true,
          },
        },
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
    const institutions = await prisma.institution.findMany({
      select: { 
        id: true,
        name: true 
      },
    });
    return institutions;
  },
  ["unique-institutions"],
  { tags: [CACHE_TAGS.userInstitutions, CACHE_TAGS.institutions] }
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
// MUTATIONS (WRITE) - with updateTag
// ============================================

export async function createUser(data: {
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
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      institutionId: data.institutionId,
      role: data.role || "USER",
      picture: data.picture,
      teacherId: data.teacherId,
      sectionId: data.sectionId,
      roll: data.roll,
    },
  });

  // Update all user-related caches
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
  revalidateTag(CACHE_TAGS.userStats, { expire: 0 });
  revalidateTag(CACHE_TAGS.userInstitutions, { expire: 0 });

  return user;
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    institutionId?: string;
    password?: string;
    role?: Role;
    picture?: string;
    sectionId?: string;
    roll?: string;
  }
) {
  const user = await prisma.user.update({
    where: { id },
    data,
  });

  // Update all user-related caches
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
  revalidateTag(CACHE_TAGS.userStats, { expire: 0 });
  revalidateTag(CACHE_TAGS.userInstitutions, { expire: 0 });

  return user;
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  });

  // Update all user-related caches
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
  revalidateTag(CACHE_TAGS.userStats, { expire: 0 });
  revalidateTag(CACHE_TAGS.userInstitutions, { expire: 0 });
}

export async function updateUserRole(id: string, role: Role) {
  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });

  // Update all user-related caches
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
  revalidateTag(CACHE_TAGS.userStats, { expire: 0 });

  return user;
}
