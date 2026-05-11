/**
 * Tenant Guard — Reusable multi-tenancy verification helpers.
 * 
 * Verifies that entity IDs (section, subject, teacher, class, student)
 * belong to a specific institution before allowing operations.
 * 
 * Usage:
 *   import { verifyAllBelongToInstitution } from "@/lib/tenant-guard";
 *   
 *   const check = await verifyAllBelongToInstitution(institutionId, {
 *     sectionId, subjectId, teacherId
 *   });
 *   if (!check.valid) {
 *     return NextResponse.json({ error: check.message }, { status: 403 });
 *   }
 */

import { prisma } from "@/lib/prisma";

interface TenantCheckInput {
  sectionId?: string;
  subjectId?: string;
  teacherId?: string;
  classId?: string;
  studentId?: string;
}

interface TenantCheckResult {
  valid: boolean;
  message: string;
}

/**
 * Verify a section belongs to the given institution (via its parent class).
 */
export async function verifySectionBelongsToInstitution(
  sectionId: string,
  institutionId: string
): Promise<boolean> {
  const section = await prisma.section.findFirst({
    where: {
      id: sectionId,
      class: { institutionId },
    },
    select: { id: true },
  });
  return !!section;
}

/**
 * Verify a subject belongs to the given institution.
 */
export async function verifySubjectBelongsToInstitution(
  subjectId: string,
  institutionId: string
): Promise<boolean> {
  const subject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      institutionId,
    },
    select: { id: true },
  });
  return !!subject;
}

/**
 * Verify a teacher belongs to the given institution.
 */
export async function verifyTeacherBelongsToInstitution(
  teacherId: string,
  institutionId: string
): Promise<boolean> {
  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
      institutionId,
    },
    select: { id: true },
  });
  return !!teacher;
}

/**
 * Verify a class belongs to the given institution.
 */
export async function verifyClassBelongsToInstitution(
  classId: string,
  institutionId: string
): Promise<boolean> {
  const cls = await prisma.class.findFirst({
    where: {
      id: classId,
      institutionId,
    },
    select: { id: true },
  });
  return !!cls;
}

/**
 * Verify a student belongs to the given institution.
 */
export async function verifyStudentBelongsToInstitution(
  studentId: string,
  institutionId: string
): Promise<boolean> {
  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: "STUDENT",
      institutionId,
    },
    select: { id: true },
  });
  return !!student;
}

/**
 * Batch verification — checks all provided IDs belong to the institution.
 * Runs checks in parallel for performance.
 * Returns on the first failure with a descriptive error message.
 */
export async function verifyAllBelongToInstitution(
  institutionId: string,
  ids: TenantCheckInput
): Promise<TenantCheckResult> {
  const checks: Promise<{ field: string; valid: boolean }>[] = [];

  if (ids.sectionId) {
    checks.push(
      verifySectionBelongsToInstitution(ids.sectionId, institutionId).then(
        (valid) => ({ field: "Section", valid })
      )
    );
  }

  if (ids.subjectId) {
    checks.push(
      verifySubjectBelongsToInstitution(ids.subjectId, institutionId).then(
        (valid) => ({ field: "Subject", valid })
      )
    );
  }

  if (ids.teacherId) {
    checks.push(
      verifyTeacherBelongsToInstitution(ids.teacherId, institutionId).then(
        (valid) => ({ field: "Teacher", valid })
      )
    );
  }

  if (ids.classId) {
    checks.push(
      verifyClassBelongsToInstitution(ids.classId, institutionId).then(
        (valid) => ({ field: "Class", valid })
      )
    );
  }

  if (ids.studentId) {
    checks.push(
      verifyStudentBelongsToInstitution(ids.studentId, institutionId).then(
        (valid) => ({ field: "Student", valid })
      )
    );
  }

  const results = await Promise.all(checks);
  const failed = results.find((r) => !r.valid);

  if (failed) {
    return {
      valid: false,
      message: `${failed.field} does not belong to your institution`,
    };
  }

  return { valid: true, message: "" };
}
