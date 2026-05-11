"use server";

import { prisma } from "@/lib/prisma";
import { Role } from "@/app/generated/prisma/client";
import { CACHE_TAGS } from "@/lib/cache-tags";
import { revalidateTag } from "next/cache";
import {
  getFromCache,
  setInCache,
  invalidateUserCache,
  REDIS_KEYS,
} from "@/lib/redis";
import bcrypt from "bcryptjs";

// ============================================
// TYPES
// ============================================

export type UserFilters = {
  search?: string;
  role?: string;
  institution?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
};

export type UserData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  picture: string | null;
  institutionId: string | null;
  institution: { id: string; name: string } | null;
  teacherId: string | null;
  sectionId: string | null;
  section: {
    id: string;
    name: string;
    class: { id: string; name: string };
  } | null;
  roll: string | null;
  createdAt: Date;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
  institutionId?: string;
  picture?: string;
  teacherId?: string;
  sectionId?: string;
  roll?: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  phone?: string;
  role?: Role;
  institutionId?: string | null;
  picture?: string;
  sectionId?: string | null;
  roll?: string;
  // Teacher-specific fields
  classTeacherSectionId?: string | null;
  teacherAssignments?: string[];
};

// ============================================
// QUERIES
// ============================================

/**
 * Get all users with optional filtering and pagination
 */
export async function getUsers(filters: UserFilters = {}) {
  const { search, role, institution, dateFrom, dateTo, page = 1, limit = 50 } = filters;
  
  // Try Redis cache first (only for unfiltered requests)
  const isUnfiltered = !search && !role && !institution && !dateFrom && !dateTo;
  if (isUnfiltered) {
    const cached = await getFromCache<UserData[]>(REDIS_KEYS.users());
    if (cached) {
      // Apply pagination to cached results
      const start = (page - 1) * limit;
      return {
        users: cached.slice(start, start + limit),
        total: cached.length,
        page,
        limit,
        totalPages: Math.ceil(cached.length / limit),
      };
    }
  }
  
  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }
  
  if (role && role !== "ALL") {
    where.role = role as Role;
  }
  
  if (institution) {
    if (institution === "NONE") {
      where.institutionId = null;
    } else if (institution !== "ALL") {
      where.institution = { name: institution };
    }
  }
  
  if (dateFrom) {
    where.createdAt = { ...where.createdAt, gte: new Date(dateFrom) };
  }
  
  if (dateTo) {
    where.createdAt = { ...where.createdAt, lte: new Date(dateTo + "T23:59:59") };
  }
  
  // Get total count
  const total = await prisma.user.count({ where });
  
  // Get users with pagination
  const users = await prisma.user.findMany({
    where,
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
      section: {
        include: { class: true },
      },
      roll: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });
  
  // Cache unfiltered results
  if (isUnfiltered && page === 1) {
    // Fetch all for caching
    const allUsers = await prisma.user.findMany({
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
    await setInCache(REDIS_KEYS.users(), allUsers, 300); // 5 min TTL
  }
  
  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string) {
  // Try cache first
  const cached = await getFromCache<UserData>(REDIS_KEYS.userById(id));
  if (cached) return cached;
  
  const user = await prisma.user.findUnique({
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
      // Teacher-specific relations
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
  
  if (user) {
    await setInCache(REDIS_KEYS.userById(id), user, 300);
  }
  
  return user;
}

/**
 * Get user statistics
 */
export async function getUserStats() {
  // Try cache first
  const cached = await getFromCache<{
    total: number;
    superAdmins: number;
    admins: number;
    teachers: number;
    students: number;
    users: number;
  }>(REDIS_KEYS.userStats());
  if (cached) return cached;
  
  const [total, superAdmins, admins, teachers, students, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { role: "USER" } }),
  ]);
  
  const stats = { total, superAdmins, admins, teachers, students, users };
  await setInCache(REDIS_KEYS.userStats(), stats, 300);
  
  return stats;
}

/**
 * Get unique institutions for filter dropdown
 */
export async function getUniqueInstitutions() {
  const cached = await getFromCache<{ id: string; name: string }[]>(
    REDIS_KEYS.userInstitutions()
  );
  if (cached) return cached;
  
  const institutions = await prisma.institution.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  
  await setInCache(REDIS_KEYS.userInstitutions(), institutions, 600);
  return institutions;
}

// ============================================
// MUTATIONS
// ============================================

/**
 * Create a new user
 */
export async function createUser(data: CreateUserInput) {
  // Validate email uniqueness
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    throw new Error("A user with this email already exists");
  }
  
  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);
  
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: data.role || "USER",
      institutionId: data.institutionId,
      picture: data.picture,
      teacherId: data.teacherId,
      sectionId: data.sectionId,
      roll: data.roll,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  
  // Invalidate caches
  await invalidateUserCache();
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
  revalidateTag(CACHE_TAGS.userStats, { expire: 0 });
  
  return user;
}

/**
 * Update a user
 */
export async function updateUser(id: string, data: UpdateUserInput) {
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("User not found");
  }
  
  // Check email uniqueness if email is being changed
  if (data.email && data.email !== existing.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (emailExists) {
      throw new Error("A user with this email already exists");
    }
  }
  
  // Use transaction for updating user and related data
  const user = await prisma.$transaction(async (tx) => {
    // Update basic user info
    const updatedUser = await tx.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        institutionId: data.institutionId,
        picture: data.picture,
        sectionId: data.sectionId,
        roll: data.roll,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    // Handle teacher-specific updates
    if (data.role === "TEACHER") {
      // Update class teacher assignment
      if (data.classTeacherSectionId !== undefined) {
        // First, remove this user as class teacher from any existing sections
        await tx.section.updateMany({
          where: { classTeacherId: id },
          data: { classTeacherId: null },
        });
        
        // Then, set as class teacher for the new section if specified
        if (data.classTeacherSectionId) {
          await tx.section.update({
            where: { id: data.classTeacherSectionId },
            data: { classTeacherId: id },
          });
        }
      }

      // Update teacher assignments (sections where teacher teaches)
      if (data.teacherAssignments !== undefined) {
        // Delete existing assignments
        await tx.teacherAssignment.deleteMany({
          where: { teacherId: id },
        });
        
        // Create new assignments (without subject for now - can be enhanced later)
        // Note: TeacherAssignment requires a subjectId, so we'll need to handle this differently
        // For now, we'll skip this if no subject system is in place
        // This can be enhanced to include subject selection in the modal
      }
    } else {
      // If role changed from TEACHER to something else, clean up teacher-specific data
      const newRole = data.role as Role | undefined;
      if (existing.role === "TEACHER" && newRole && newRole !== "TEACHER") {
        // Remove as class teacher
        await tx.section.updateMany({
          where: { classTeacherId: id },
          data: { classTeacherId: null },
        });
        
        // Remove teacher assignments
        await tx.teacherAssignment.deleteMany({
          where: { teacherId: id },
        });
      }
    }

    // If role changed from STUDENT to something else, clean up student-specific data
    const finalRole = data.role as Role | undefined;
    if (existing.role === "STUDENT" && finalRole && finalRole !== "STUDENT") {
      await tx.user.update({
        where: { id },
        data: {
          sectionId: null,
          roll: null,
        },
      });
    }

    return updatedUser;
  });
  
  // Invalidate caches
  await invalidateUserCache();
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
  revalidateTag(CACHE_TAGS.userStats, { expire: 0 });
  
  return user;
}

/**
 * Delete a user
 */
export async function deleteUser(id: string) {
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("User not found");
  }
  
  // Prevent deleting the last super admin
  if (existing.role === "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) {
      throw new Error("Cannot delete the last Super Admin");
    }
  }
  
  await prisma.user.delete({ where: { id } });
  
  // Invalidate caches
  await invalidateUserCache();
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
  revalidateTag(CACHE_TAGS.userStats, { expire: 0 });
  
  return { success: true };
}

/**
 * Update user role
 */
export async function updateUserRole(id: string, role: Role) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("User not found");
  }
  
  // Prevent changing the role of the last super admin
  if (existing.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const superAdminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });
    if (superAdminCount <= 1) {
      throw new Error("Cannot change the role of the last Super Admin");
    }
  }
  
  const user = await prisma.user.update({
    where: { id },
    data: { role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
  
  // Invalidate caches
  await invalidateUserCache();
  revalidateTag(CACHE_TAGS.users, { expire: 0 });
  revalidateTag(CACHE_TAGS.userStats, { expire: 0 });
  
  return user;
}

/**
 * Reset user password
 */
export async function resetUserPassword(id: string, newPassword: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("User not found");
  }
  
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword },
  });
  
  return { success: true };
}
