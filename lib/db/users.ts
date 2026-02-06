"use server";

import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";

// ============================================
// QUERIES (READ)
// ============================================

export const getUsers = unstable_cache(
  () =>
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    }),
  ["users"],
  { tags: ["users"] }
);






export const getUserById = unstable_cache(
  (id: string) =>
    prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
        institution: true,
      },
    }),
  ["user"],
  { tags: ["users"] }
);

export const getUserByEmail = unstable_cache(
  (email: string) =>
    prisma.user.findUnique({
      where: { email },
    }),
  ["user-by-email"],
  { tags: ["users"] }
);

// ============================================
// MUTATIONS (WRITE)
// ============================================

export async function createUser(data: {
  email: string;
  password: string;
  phone?: string;
  provider?: string;
  role?: Role;
  institutionId?: string;
}) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: data.password,
      phone: data.phone,
      provider: data.provider,
      role: data.role || "STUDENT",
      institutionId: data.institutionId,
    },
  });

  revalidateTag("users", "default");
  return user;
}

export async function updateUser(
  id: string,
  data: {
    email?: string;
    phone?: string;
    password?: string;
    role?: Role;
    institutionId?: string;
  }
) {
  const user = await prisma.user.update({
    where: { id },
    data,
  });

  revalidateTag("users", "default");
  return user;
}

export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id },
  });

  revalidateTag("users", "default");
  revalidateTag("attendances", "default");
}

export async function updateUserRole(id: string, role: Role) {
  const user = await prisma.user.update({
    where: { id },
    data: { role },
  });

  revalidateTag("users", "default");
  return user;
}
