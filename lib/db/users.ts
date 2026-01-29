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
    }),
  ["users"],
  { tags: ["users"] }
);







export const getUserById = unstable_cache(
  (id: string) =>
    prisma.user.findUnique({
      where: { id: id }  
    }),
  ["user"],
  { tags: ["users"] }
);




export async function createUser(data: {
  email: string;
  name?: string;
  password?: string;
  provider: string;
  role?: Role;
}) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: data.password,
      provider: data.provider,
      role: data.role || "STUDENT",
    },
  });

  revalidateTag("users", "default");
  return user;
}









export async function updateUser(
  id: string,
  data: {
    email?: string;
    name?: string;
    password?: string;
    role?: Role;
  }
) {
  const user = await prisma.user.update({
    where: { id: id },
    data,
  });

  revalidateTag("users", "default");

  return user;
}





export async function deleteUser(id: string) {
  await prisma.user.delete({
    where: { id: id },
  });

  revalidateTag("users", "default");
  revalidateTag("attendances", "default");
}















export async function updateUserRole(id: string, role: Role) {
  const user = await prisma.user.update({
    where: { id: id },
    data: { role: role },
  });

  revalidateTag("users", "default");
  return user;
}




