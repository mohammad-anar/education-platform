import prisma from "../../../config/prisma.js";
import { IAuditContext } from "../../../utils/audit.js";
import { can } from "./permission-evaluator.js";

/**
 * Resolves entity IDs assigned to the current user (e.g. courses, class groups, sections, or students)
 * based on teacher profiles, course instructors, class teachers, or guardian linkages.
 *
 * @param {IAuditContext} ctx - The verified audit/auth context containing userId and instituteId.
 * @param {string} resourceType - The targeted resource entity (e.g. "course", "classGroup", "section", "student").
 * @returns {Promise<string[]>} List of entity UUIDs the user is explicitly assigned to.
 */
export const resolveAssignedScope = async (
  ctx: IAuditContext,
  resourceType: string,
): Promise<string[]> => {
  const userId = ctx.userId;
  if (!userId) return [];

  const normalized = resourceType.toLowerCase().replace(/[^a-z]/g, "");

  // 1. Courses Assignment (CourseTeacher)
  if (normalized.includes("course") && !normalized.includes("enrollment")) {
    const courseTeachers = await (prisma as any).courseTeacher.findMany({
      where: {
        teacher: { userId },
      },
      select: { courseId: true },
    });
    return Array.from(new Set(courseTeachers.map((ct: any) => ct.courseId as string)));
  }

  // 2. ClassGroups Assignment (ClassTeacher)
  if (normalized.includes("class") || normalized.includes("cohort")) {
    const classTeachers = await (prisma as any).classTeacher.findMany({
      where: {
        teacher: { userId },
      },
      select: { classGroupId: true },
    });
    return Array.from(new Set(classTeachers.map((ct: any) => ct.classGroupId as string)));
  }

  // 3. Sections Assignment
  if (normalized.includes("section")) {
    const sections = await (prisma as any).section.findMany({
      where: {
        classGroup: {
          teacherAssignments: {
            some: {
              teacher: { userId },
            },
          },
        },
      },
      select: { id: true },
    });
    return Array.from(new Set(sections.map((s: any) => s.id as string)));
  }

  // 4. Students Assignment (Guardian's Wards or Teacher's Students)
  if (normalized.includes("student")) {
    const studentIds: string[] = [];

    // Check if Guardian
    const guardianWards = await (prisma as any).studentGuardian.findMany({
      where: {
        guardian: { userId },
      },
      select: { studentId: true },
    });
    studentIds.push(...guardianWards.map((gw: any) => gw.studentId as string));

    // Check if Teacher
    const teacherCourseStudents = await (prisma as any).courseEnrollment.findMany({
      where: {
        course: {
          teachers: {
            some: {
              teacher: { userId },
            },
          },
        },
      },
      select: { studentId: true },
    });
    studentIds.push(...teacherCourseStudents.map((cs: any) => cs.studentId as string));

    return Array.from(new Set(studentIds));
  }

  return [];
};

/**
 * Builds a Prisma query `where` filter condition enforcing tenant isolation and evaluated permission scope.
 * - OWN -> Filters by user ownership (userId, createdById, or student.userId).
 * - ASSIGNED -> Filters by assigned entity IDs.
 * - INSTITUTE -> Filters strictly by tenant instituteId.
 * - ALL -> Permitted without tenant boundary (Platform Super Admin).
 * - Disallowed -> Injects an impossible filter `{ id: "00000000-0000-0000-0000-000000000000" }`.
 *
 * @param {IAuditContext} ctx - The verified auth context.
 * @param {string} code - The permission code to evaluate.
 * @param {string} model - The Prisma model or resource name.
 * @returns {Promise<Record<string, any>>} A Prisma where condition object.
 */
export const buildScopeWhere = async (
  ctx: IAuditContext,
  code: string,
  model: string,
): Promise<Record<string, any>> => {
  const decision = await can(ctx, code);

  // If permission check failed, completely block the query with an impossible match
  if (!decision.allowed) {
    return { id: "00000000-0000-0000-0000-000000000000" };
  }

  const scope = decision.scope || "OWN";
  const instituteId = ctx.instituteId;
  const userId = ctx.userId;

  // Global scope (Platform Super Admin)
  if (scope === "ALL") {
    return instituteId ? { instituteId } : {};
  }

  // Tenant-wide scope
  if (scope === "INSTITUTE") {
    return instituteId ? { instituteId } : {};
  }

  // Assigned scope
  if (scope === "ASSIGNED") {
    const assignedIds = await resolveAssignedScope(ctx, model);
    return {
      ...(instituteId ? { instituteId } : {}),
      id: { in: assignedIds },
    };
  }

  // OWN scope
  const normalizedModel = model.toLowerCase();
  if (normalizedModel.includes("student") && !normalizedModel.includes("enrollment")) {
    return {
      ...(instituteId ? { instituteId } : {}),
      userId,
    };
  }

  if (normalizedModel.includes("enrollment") || normalizedModel.includes("result")) {
    return {
      ...(instituteId ? { instituteId } : {}),
      student: { userId },
    };
  }

  if (normalizedModel.includes("notification")) {
    return {
      userId,
    };
  }

  return {
    ...(instituteId ? { instituteId } : {}),
    OR: [
      { userId },
      { createdById: userId },
    ],
  };
};

export default {
  resolveAssignedScope,
  buildScopeWhere,
};
