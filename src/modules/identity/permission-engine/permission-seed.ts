import prisma from "../../../config/prisma.js";
import logger from "../../../utils/logger.js";
import {
  PERMISSION_CATALOG,
  IPermissionDefinition,
  PermissionScope,
} from "./permission-catalog.js";

/**
 * Idempotently seeds all system permissions from the catalog into the database.
 * Splits codes using the resource+action model (matching unique @@unique([resource, action])).
 *
 * @returns {Promise<{ total: number; seeded: number }>} Seeding results summary.
 */
export const seedPermissions = async (): Promise<{ total: number; seeded: number }> => {
  logger.info(`[PERMISSION_SEED] Seeding ${PERMISSION_CATALOG.length} permissions into database...`);

  let seededCount = 0;
  for (const perm of PERMISSION_CATALOG) {
    await (prisma as any).permission.upsert({
      where: {
        resource_action: {
          resource: perm.resource,
          action: perm.action,
        },
      },
      update: {
        description: perm.description,
      },
      create: {
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
    });
    seededCount++;
  }

  logger.info(`[PERMISSION_SEED] Successfully seeded ${seededCount} permissions.`);
  return {
    total: PERMISSION_CATALOG.length,
    seeded: seededCount,
  };
};

/**
 * Helper to look up permission records by code.
 */
const getPermissionMap = async (): Promise<Map<string, string>> => {
  const dbPermissions = await (prisma as any).permission.findMany({
    select: { id: true, resource: true, action: true },
  });

  const map = new Map<string, string>();
  for (const p of dbPermissions) {
    map.set(`${p.resource}.${p.action}`, p.id);
  }
  return map;
};

/**
 * System Role Template definition with permission filters and scopes.
 */
interface IRoleTemplate {
  name: string;
  code: string;
  description: string;
  filter: (perm: IPermissionDefinition) => { assign: boolean; scope: PermissionScope };
}

const SYSTEM_ROLE_TEMPLATES: IRoleTemplate[] = [
  {
    name: "Institute Owner",
    code: "INSTITUTE_OWNER",
    description: "Complete control and ownership over the tenant institute.",
    filter: (p) => ({
      assign: true,
      scope: p.defaultScope === "ALL" ? "ALL" : "INSTITUTE",
    }),
  },
  {
    name: "Institute Administrator",
    code: "INSTITUTE_ADMIN",
    description: "Operational administrator managing academics, faculty, students, and courses.",
    filter: (p) => {
      // Exclude institute delete/suspend and subscription delete
      if (
        p.code === "saas.institute.delete" ||
        p.code === "saas.institute.suspend" ||
        p.code === "saas.subscription.delete"
      ) {
        return { assign: false, scope: "INSTITUTE" };
      }
      return { assign: true, scope: "INSTITUTE" };
    },
  },
  {
    name: "Teacher / Faculty",
    code: "TEACHER",
    description: "Faculty member managing assigned courses, routines, attendance, and exam marks.",
    filter: (p) => {
      if (p.module === "lms") {
        if (p.resource === "lms.lessonNote") return { assign: true, scope: "OWN" };
        if (p.action === "read" || p.action === "update") return { assign: true, scope: "ASSIGNED" };
        if (p.action === "create") return { assign: true, scope: "ASSIGNED" };
      }
      if (p.module === "attendance") {
        if (p.resource === "attendance.routine" && p.action === "read") return { assign: true, scope: "ASSIGNED" };
        if (p.resource === "attendance.session") return { assign: true, scope: "ASSIGNED" };
        if (p.resource === "attendance.liveClass") return { assign: true, scope: "ASSIGNED" };
      }
      if (p.module === "assessment") {
        if (p.code === "assessment.exam.read" || p.code === "assessment.exam.updateMark") {
          return { assign: true, scope: "ASSIGNED" };
        }
        if (p.resource === "assessment.assessment") return { assign: true, scope: "ASSIGNED" };
      }
      if (p.code === "people.student.read") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "people.teacher.read") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "platform.notice.read") return { assign: true, scope: "INSTITUTE" };
      if (p.resource === "platform.notification") return { assign: true, scope: "OWN" };
      if (p.resource === "platform.file" && (p.action === "create" || p.action === "read")) {
        return { assign: true, scope: "INSTITUTE" };
      }
      if (p.module === "directory") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "support.ticket.view") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "support.session.host") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "teacher.dashboard.view") return { assign: true, scope: "ASSIGNED" };
      return { assign: false, scope: "OWN" };
    },
  },
  {
    name: "Student",
    code: "STUDENT",
    description: "Enrolled learner consuming assigned LMS courses, submitting assessments, and viewing results.",
    filter: (p) => {
      if (p.module === "lms" && p.action === "read") return { assign: true, scope: "ASSIGNED" };
      if (p.resource === "lms.lessonNote") return { assign: true, scope: "OWN" };
      if (p.code === "assessment.assessment.read") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "assessment.result.read") return { assign: true, scope: "OWN" };
      if (p.code === "attendance.session.read") return { assign: true, scope: "OWN" };
      if (p.code === "attendance.routine.read") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "attendance.liveClass.read") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "platform.notice.read") return { assign: true, scope: "INSTITUTE" };
      if (p.resource === "platform.notification") return { assign: true, scope: "OWN" };
      if (p.code === "platform.certificate.read") return { assign: true, scope: "OWN" };
      if (p.module === "directory") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "student.portal.view") return { assign: true, scope: "OWN" };
      if (p.code === "support.ticket.create") return { assign: true, scope: "OWN" };
      if (p.code === "support.ticket.view") return { assign: true, scope: "OWN" };
      return { assign: false, scope: "OWN" };
    },
  },
  {
    name: "Guardian / Parent",
    code: "GUARDIAN",
    description: "Parent or legal guardian monitoring academic progress, attendance, and fees of their wards.",
    filter: (p) => {
      if (p.code === "people.student.read") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "attendance.session.read") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "assessment.result.read") return { assign: true, scope: "ASSIGNED" };
      if (p.code === "platform.notice.read") return { assign: true, scope: "INSTITUTE" };
      if (p.resource === "platform.notification") return { assign: true, scope: "OWN" };
      if (p.module === "directory") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "guardian.dashboard.view") return { assign: true, scope: "ASSIGNED" };
      return { assign: false, scope: "OWN" };
    },
  },
  {
    name: "Staff",
    code: "STAFF",
    description: "General administrative and support staff.",
    filter: (p) => {
      if (p.code === "attendance.calendar.read") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "attendance.routine.read") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "platform.notice.read") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "people.staff.read") return { assign: true, scope: "OWN" };
      if (p.resource === "platform.notification") return { assign: true, scope: "OWN" };
      if (p.module === "directory") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "support.ticket.view") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "support.session.host") return { assign: true, scope: "ASSIGNED" };
      return { assign: false, scope: "OWN" };
    },
  },
  {
    name: "Support Agent",
    code: "SUPPORT_AGENT",
    description: "Help desk and student support personnel.",
    filter: (p) => {
      if (
        p.code === "people.student.read" ||
        p.code === "people.teacher.read" ||
        p.code === "people.guardian.read"
      ) {
        return { assign: true, scope: "INSTITUTE" };
      }
      if (p.module === "platform" && p.action === "read") return { assign: true, scope: "INSTITUTE" };
      if (p.resource === "platform.notice" || p.resource === "platform.notification") {
        return { assign: true, scope: "INSTITUTE" };
      }
      if (p.module === "directory") return { assign: true, scope: "INSTITUTE" };
      if (p.module === "support") {
        if (p.code === "support.settings.manage") return { assign: false, scope: "INSTITUTE" };
        return { assign: true, scope: p.code === "support.session.host" ? "ASSIGNED" : "INSTITUTE" };
      }
      return { assign: false, scope: "INSTITUTE" };
    },
  },
  {
    name: "Accountant",
    code: "ACCOUNTANT",
    description: "Finance and accounts officer handling fee records and subscriptions.",
    filter: (p) => {
      if (p.code === "saas.subscription.read") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "people.student.read") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "academic.enrollment.read") return { assign: true, scope: "INSTITUTE" };
      if (p.code === "platform.notice.read") return { assign: true, scope: "INSTITUTE" };
      if (p.resource === "platform.notification") return { assign: true, scope: "OWN" };
      return { assign: false, scope: "INSTITUTE" };
    },
  },
];

/**
 * Seeds standard tenant system roles for an institute with sensible default permissions and scopes.
 * Marks roles with isSystem = true.
 *
 * @param {string} instituteId - The target tenant institute UUID.
 * @returns {Promise<any[]>} The list of created or updated system roles.
 */
export const seedSystemRoles = async (instituteId: string): Promise<any[]> => {
  const permMap = await getPermissionMap();
  const createdRoles: any[] = [];

  for (const template of SYSTEM_ROLE_TEMPLATES) {
    // Upsert role for this institute
    const role = await (prisma as any).role.upsert({
      where: {
        instituteId_code: {
          instituteId,
          code: template.code,
        },
      },
      update: {
        name: template.name,
        description: template.description,
        isSystem: true,
      },
      create: {
        instituteId,
        name: template.name,
        code: template.code,
        description: template.description,
        isSystem: true,
      },
    });

    // Determine permissions to assign
    const rolePermissionsData: { roleId: string; permissionId: string; scope: any }[] = [];
    for (const permDef of PERMISSION_CATALOG) {
      const { assign, scope } = template.filter(permDef);
      if (assign) {
        const permissionId = permMap.get(permDef.code);
        if (permissionId) {
          rolePermissionsData.push({
            roleId: role.id,
            permissionId,
            scope,
          });
        }
      }
    }

    // Replace role permissions atomically in transaction
    await (prisma as any).$transaction(async (tx: any) => {
      await tx.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      if (rolePermissionsData.length > 0) {
        await tx.rolePermission.createMany({
          data: rolePermissionsData,
          skipDuplicates: true,
        });
      }
    });

    createdRoles.push(role);
  }

  logger.info(`[SYSTEM_ROLES_SEED] Seeded ${createdRoles.length} system roles for institute ${instituteId}`);
  return createdRoles;
};

/**
 * Seeds the platform super admin role.
 * Role has instituteId = null and isSystem = true.
 * Wildcard permissions are handled dynamically in code without inserting hundreds of redundant database rows.
 *
 * @returns {Promise<any>} The PLATFORM_SUPER_ADMIN role record.
 */
export const seedPlatformRole = async (): Promise<any> => {
  // Check if platform role exists with instituteId = null
  let role = await (prisma as any).role.findFirst({
    where: {
      code: "PLATFORM_SUPER_ADMIN",
      instituteId: null,
    },
  });

  if (!role) {
    role = await (prisma as any).role.create({
      data: {
        name: "Platform Super Administrator",
        code: "PLATFORM_SUPER_ADMIN",
        description: "Root platform administrator with unrestricted access across all tenants.",
        isSystem: true,
        instituteId: null,
      },
    });
  } else {
    role = await (prisma as any).role.update({
      where: { id: role.id },
      data: {
        name: "Platform Super Administrator",
        isSystem: true,
        description: "Root platform administrator with unrestricted access across all tenants.",
      },
    });
  }

  logger.info(`[PLATFORM_ROLE_SEED] Seeded PLATFORM_SUPER_ADMIN role (${role.id}) with wildcard handling in code.`);
  return role;
};

export default {
  seedPermissions,
  seedSystemRoles,
  seedPlatformRole,
};
