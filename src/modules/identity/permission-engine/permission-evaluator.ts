import prisma from "../../../config/prisma.js";
import { IAuditContext, logAudit } from "../../../utils/audit.js";
import { PermissionScope } from "./permission-catalog.js";
import { getEffectivePermissions } from "./permission-cache.js";
import { resolveAssignedScope } from "./scope-resolver.js";

/**
 * Result structure returned by permission evaluation.
 */
export interface ICanResult {
  allowed: boolean;
  scope?: PermissionScope;
  reason?: string;
}

/**
 * Core permission evaluation engine determining whether an operation is authorized.
 * Implements:
 * 1. User status check (active, not deleted, not suspended/locked).
 * 2. Membership status check (active within institute).
 * 3. Platform super admin bypass (instituteId=null, isSystem=true; audited).
 * 4. User permission override check (DENY unconditionally wins; active check).
 * 5. Grant override check.
 * 6. Role union check via effective permissions map.
 * 7. Contextual resource scope validation (OWN, ASSIGNED, INSTITUTE, ALL).
 *
 * Rules: Strictly zero role-name checks.
 *
 * @param {IAuditContext} ctx - Auth and audit context containing userId, instituteId, ip, etc.
 * @param {string} code - The permission code being requested (e.g. "lms.course.update").
 * @param {any} [resource] - Optional target resource instance for contextual scope checks.
 * @returns {Promise<ICanResult>} Authorization decision with scope and reason.
 */
export const can = async (
  ctx: IAuditContext,
  code: string,
  resource?: any,
): Promise<ICanResult> => {
  const { userId, instituteId } = ctx;

  if (!userId) {
    return { allowed: false, reason: "UNAUTHENTICATED" };
  }

  // 1. Verify User Status in DB
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: { status: true, deletedAt: true },
  });

  if (!user) {
    return { allowed: false, reason: "USER_NOT_FOUND" };
  }

  if (user.deletedAt) {
    return { allowed: false, reason: "USER_DELETED" };
  }

  if (user.status !== "ACTIVE") {
    return { allowed: false, reason: `USER_${user.status}` };
  }

  // 2. Check Platform Super Admin Bypass (Relational check: instituteId is null and isSystem is true. Zero role-name checks.)
  const platformAdminRole = await (prisma as any).userRole.findFirst({
    where: {
      userId,
      role: {
        instituteId: null,
        isSystem: true,
      },
    },
  });

  if (platformAdminRole) {
    // Record audit log for platform super admin privilege usage
    await logAudit({
      ctx,
      action: "PLATFORM_ADMIN_BYPASS",
      entityType: "Permission",
      entityId: code,
      newValue: {
        code,
        targetInstituteId: instituteId || null,
        resourceId: resource?.id || null,
      },
    });

    return { allowed: true, scope: "ALL", reason: "PLATFORM_ADMIN_BYPASS" };
  }

  // 3. Verify Membership Status if operating within a tenant institute
  if (instituteId) {
    const membership = await (prisma as any).instituteMembership.findUnique({
      where: {
        instituteId_userId: {
          instituteId,
          userId,
        },
      },
      select: { status: true },
    });

    if (!membership || membership.status !== "ACTIVE") {
      return { allowed: false, reason: "MEMBERSHIP_INACTIVE" };
    }

    // Verify Institute Status
    const institute = await (prisma as any).institute.findUnique({
      where: { id: instituteId },
      select: { status: true, deletedAt: true },
    });

    if (!institute || institute.deletedAt || institute.status !== "ACTIVE") {
      return { allowed: false, reason: "INSTITUTE_INACTIVE" };
    }
  }

  // 4. Check UserPermissionOverride (DENY wins over everything; ignore expired)
  if (instituteId) {
    const activeOverrides = await (prisma as any).userPermissionOverride.findMany({
      where: {
        userId,
        instituteId,
      },
      include: {
        permission: true,
      },
    });

    const now = new Date();

    // Check DENY override first
    const denyOverride = activeOverrides.find((ov: any) => {
      if (ov.expiresAt && new Date(ov.expiresAt) < now) return false;
      const permCode = `${ov.permission?.resource}.${ov.permission?.action}`;
      return ov.effect === "DENY" && permCode === code;
    });

    if (denyOverride) {
      return { allowed: false, reason: "OVERRIDE_DENIED" };
    }

    // Check GRANT override
    const grantOverride = activeOverrides.find((ov: any) => {
      if (ov.expiresAt && new Date(ov.expiresAt) < now) return false;
      const permCode = `${ov.permission?.resource}.${ov.permission?.action}`;
      return ov.effect === "GRANT" && permCode === code;
    });

    if (grantOverride) {
      return validateResourceScope(ctx, grantOverride.scope as PermissionScope, code, resource);
    }
  }

  // 5. Check Effective Permissions via merged roles (with Redis caching)
  if (!instituteId) {
    return { allowed: false, reason: "TENANT_CONTEXT_REQUIRED" };
  }

  const effectivePermissions = await getEffectivePermissions(userId, instituteId);

  // Check direct permission code or wildcard
  let grantedScope: PermissionScope | undefined = effectivePermissions.get(code);

  if (!grantedScope) {
    // Check wildcard module matching (e.g. "academic.*")
    const modulePrefix = code.split(".")[0];
    grantedScope = effectivePermissions.get(`${modulePrefix}.*`) || effectivePermissions.get("*");
  }

  if (!grantedScope) {
    return { allowed: false, reason: "PERMISSION_NOT_GRANTED" };
  }

  // 6. Contextual Resource Scope Validation
  return validateResourceScope(ctx, grantedScope, code, resource);
};

/**
 * Validates granted scope against a specific target resource object if provided.
 */
const validateResourceScope = async (
  ctx: IAuditContext,
  grantedScope: PermissionScope,
  code: string,
  resource?: any,
): Promise<ICanResult> => {
  // If no resource object provided, initial permission authorization succeeds
  if (!resource) {
    return { allowed: true, scope: grantedScope };
  }

  const { userId, instituteId } = ctx;

  // ALL scope allows cross-tenant / global access
  if (grantedScope === "ALL") {
    return { allowed: true, scope: "ALL" };
  }

  // INSTITUTE scope requires matching instituteId
  if (grantedScope === "INSTITUTE") {
    if (resource.instituteId && resource.instituteId !== instituteId) {
      return {
        allowed: false,
        scope: "INSTITUTE",
        reason: "OUTSIDE_INSTITUTE_SCOPE",
      };
    }
    return { allowed: true, scope: "INSTITUTE" };
  }

  // ASSIGNED scope requires entity ID to be in user's assigned scope
  if (grantedScope === "ASSIGNED") {
    if (resource.instituteId && resource.instituteId !== instituteId) {
      return { allowed: false, scope: "ASSIGNED", reason: "OUTSIDE_INSTITUTE_SCOPE" };
    }

    const parts = code.split(".");
    const resourceType = parts[1] || parts[0];
    const assignedIds = await resolveAssignedScope(ctx, resourceType);

    const matchesAssigned =
      assignedIds.includes(resource.id) ||
      assignedIds.includes(resource.courseId) ||
      assignedIds.includes(resource.classGroupId) ||
      assignedIds.includes(resource.sectionId) ||
      assignedIds.includes(resource.studentId);

    if (!matchesAssigned) {
      return {
        allowed: false,
        scope: "ASSIGNED",
        reason: "OUTSIDE_ASSIGNED_SCOPE",
      };
    }

    return { allowed: true, scope: "ASSIGNED" };
  }

  // OWN scope requires record ownership
  if (grantedScope === "OWN") {
    if (resource.instituteId && resource.instituteId !== instituteId) {
      return { allowed: false, scope: "OWN", reason: "OUTSIDE_INSTITUTE_SCOPE" };
    }

    const isOwner =
      resource.userId === userId ||
      resource.createdById === userId ||
      resource.student?.userId === userId ||
      resource.teacher?.userId === userId ||
      resource.guardian?.userId === userId;

    if (!isOwner) {
      return {
        allowed: false,
        scope: "OWN",
        reason: "OUTSIDE_OWN_SCOPE",
      };
    }

    return { allowed: true, scope: "OWN" };
  }

  return { allowed: false, reason: "UNKNOWN_SCOPE" };
};

export default {
  can,
};
