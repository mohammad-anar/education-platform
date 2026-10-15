import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IUserFilterRequest } from "./user.interface.js";
import { logAudit } from "../../../utils/audit.js";
import {
  getEffectivePermissions,
  invalidatePermissionCache,
} from "../permission-engine/permission-cache.js";
import { checkPrivilegeEscalation } from "../permission-engine/privilege-escalation.js";
import { PermissionScope } from "../permission-engine/permission-catalog.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).user.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: IUserFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.memberships = {
      some: {
        instituteId: ctx.instituteId,
      },
    };
  }

  const result = await (prisma as any).user.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      memberships: true,
    },
  });

  const total = await (prisma as any).user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).user.findUnique({
    where: { id },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
      memberships: true,
    },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
  }

  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).user.update({
    where: { id },
    data: payload,
  });
  return result;
};

/**
 * Deletes a user by unique ID and writes an audit log entry.
 *
 * @param {string} id - The user ID to delete.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const deleteById = async (id: string, ctx?: any) => {
  const oldUser = await (prisma as any).user.findUnique({
    where: { id },
  });

  if (!oldUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
  }

  const result = await (prisma as any).user.delete({
    where: { id },
  });

  await logAudit({
    ctx,
    action: "USER_DELETE",
    entityType: "User",
    entityId: id,
    oldValue: oldUser,
    newValue: null,
  });

  return result;
};

/**
 * Assigns a role to a user within the tenant institute.
 * Enforces privilege escalation prevention: actor cannot assign a role granting permissions
 * or scopes exceeding the actor's own effective permissions.
 *
 * @param {any} ctx - Auth and tenant context.
 * @param {string} userId - Target user identifier.
 * @param {string} roleId - Role identifier to assign.
 * @returns {Promise<any>}
 */
const assignRole = async (ctx: any, userId: string, roleId: string) => {
  const instituteId = ctx?.instituteId;

  // 1. Verify user exists
  const targetUser = await (prisma as any).user.findUnique({
    where: { id: userId },
    include: {
      memberships: instituteId ? { where: { instituteId } } : true,
    },
  });

  if (!targetUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
  }

  // 2. Verify target role exists in tenant or is global
  const targetRole = await (prisma as any).role.findFirst({
    where: {
      id: roleId,
      OR: [{ instituteId }, { instituteId: null }],
    },
    include: {
      permissions: {
        include: { permission: true },
      },
    },
  });

  if (!targetRole) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role not found.");
  }

  // 3. Privilege escalation check: Actor cannot assign a role with permissions/scopes exceeding actor's own
  if (ctx?.userId && !ctx?.isPlatformAdmin && targetRole.permissions?.length > 0) {
    const grantsToCheck = targetRole.permissions.map((rp: any) => ({
      permissionCode: `${rp.permission.resource}.${rp.permission.action}`,
      scope: rp.scope as PermissionScope,
    }));
    await checkPrivilegeEscalation(ctx, grantsToCheck);
  }

  // 4. Upsert userRole assignment
  const existing = await (prisma as any).userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  let result = existing;
  if (!existing) {
    result = await (prisma as any).userRole.create({
      data: {
        userId,
        roleId,
      },
      include: {
        role: true,
      },
    });
  }

  await logAudit({
    ctx,
    action: "USER_ROLE_ASSIGN",
    entityType: "UserRole",
    entityId: `${userId}:${roleId}`,
    newValue: { userId, roleId, roleCode: targetRole.code },
  });

  await invalidatePermissionCache(userId, instituteId);

  return {
    userId,
    roleId,
    roleName: targetRole.name,
    roleCode: targetRole.code,
  };
};

/**
 * Revokes a role assignment from a user.
 * Enforces the guard: NEVER remove the last active INSTITUTE_OWNER in the institute.
 *
 * @param {any} ctx - Auth and tenant context.
 * @param {string} userId - Target user identifier.
 * @param {string} roleId - Role identifier to revoke.
 * @returns {Promise<any>}
 */
const revokeRole = async (ctx: any, userId: string, roleId: string) => {
  const instituteId = ctx?.instituteId;

  const assignment = await (prisma as any).userRole.findUnique({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
    include: {
      role: true,
    },
  });

  if (!assignment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role assignment not found for this user.");
  }

  // Guard: Never remove last INSTITUTE_OWNER
  if (assignment.role.code === "INSTITUTE_OWNER") {
    const activeOwnerCount = await (prisma as any).userRole.count({
      where: {
        roleId: assignment.role.id,
        user: {
          status: "ACTIVE",
          deletedAt: null,
          memberships: instituteId
            ? {
                some: {
                  instituteId,
                  status: "ACTIVE",
                },
              }
            : undefined,
        },
      },
    });

    if (activeOwnerCount <= 1) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "Operation blocked: Cannot revoke role from the last active INSTITUTE_OWNER in the institute.",
      );
    }
  }

  await (prisma as any).userRole.delete({
    where: {
      userId_roleId: {
        userId,
        roleId,
      },
    },
  });

  await logAudit({
    ctx,
    action: "USER_ROLE_REVOKE",
    entityType: "UserRole",
    entityId: `${userId}:${roleId}`,
    oldValue: assignment,
    newValue: null,
  });

  await invalidatePermissionCache(userId, instituteId);

  return {
    success: true,
    message: `Role '${assignment.role.name}' revoked successfully from user.`,
  };
};

/**
 * Creates or updates an individual UserPermissionOverride (GRANT or DENY).
 * Enforces privilege escalation prevention on GRANT effects: actor cannot grant permissions
 * or scopes exceeding their own.
 *
 * @param {any} ctx - Auth and tenant context.
 * @param {string} userId - Target user identifier.
 * @param {any} data - { permissionCode, effect, scope?, expiresAt?, reason? }.
 * @returns {Promise<any>}
 */
const grantUserPermission = async (
  ctx: any,
  userId: string,
  data: {
    permissionCode: string;
    effect: "GRANT" | "DENY";
    scope?: PermissionScope;
    expiresAt?: string | null;
    reason?: string;
  },
) => {
  const instituteId = ctx?.instituteId;
  if (!instituteId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Institute context is required.");
  }

  const targetUser = await (prisma as any).user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
  }

  // Parse resource and action from permissionCode
  const lastDotIndex = data.permissionCode.lastIndexOf(".");
  if (lastDotIndex === -1) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Invalid permissionCode format. Expected 'resource.action'.",
    );
  }
  const resource = data.permissionCode.substring(0, lastDotIndex);
  const action = data.permissionCode.substring(lastDotIndex + 1);

  const permission = await (prisma as any).permission.findUnique({
    where: {
      resource_action: {
        resource,
        action,
      },
    },
  });

  if (!permission) {
    throw new ApiError(StatusCodes.NOT_FOUND, `Permission '${data.permissionCode}' not found.`);
  }

  const targetScope: PermissionScope = data.scope || "OWN";

  // Privilege escalation check: Actor cannot GRANT permissions or scopes exceeding actor's own
  if (data.effect === "GRANT" && ctx?.userId && !ctx?.isPlatformAdmin) {
    await checkPrivilegeEscalation(ctx, [
      {
        permissionCode: data.permissionCode,
        scope: targetScope,
      },
    ]);
  }

  const oldOverride = await (prisma as any).userPermissionOverride.findUnique({
    where: {
      instituteId_userId_permissionId: {
        instituteId,
        userId,
        permissionId: permission.id,
      },
    },
  });

  const expiresDate = data.expiresAt ? new Date(data.expiresAt) : null;

  const result = await (prisma as any).userPermissionOverride.upsert({
    where: {
      instituteId_userId_permissionId: {
        instituteId,
        userId,
        permissionId: permission.id,
      },
    },
    create: {
      instituteId,
      userId,
      permissionId: permission.id,
      effect: data.effect,
      scope: targetScope,
      expiresAt: expiresDate,
      reason: data.reason || null,
      createdById: ctx?.userId || null,
    },
    update: {
      effect: data.effect,
      scope: targetScope,
      expiresAt: expiresDate,
      reason: data.reason || null,
      createdById: ctx?.userId || null,
    },
    include: {
      permission: true,
    },
  });

  await logAudit({
    ctx,
    action: oldOverride ? "USER_PERMISSION_OVERRIDE_UPDATE" : "USER_PERMISSION_OVERRIDE_CREATE",
    entityType: "UserPermissionOverride",
    entityId: result.id,
    oldValue: oldOverride,
    newValue: result,
  });

  await invalidatePermissionCache(userId, instituteId);

  return result;
};

/**
 * Lists all permission overrides configured for a user within the tenant institute.
 *
 * @param {any} ctx - Auth and tenant context.
 * @param {string} userId - Target user identifier.
 * @returns {Promise<any[]>}
 */
const listUserPermissionOverrides = async (ctx: any, userId: string) => {
  const instituteId = ctx?.instituteId;

  const overrides = await (prisma as any).userPermissionOverride.findMany({
    where: {
      userId,
      ...(instituteId ? { instituteId } : {}),
    },
    include: {
      permission: true,
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  return overrides.map((ov: any) => ({
    id: ov.id,
    userId: ov.userId,
    instituteId: ov.instituteId,
    permissionCode: `${ov.permission.resource}.${ov.permission.action}`,
    permissionDescription: ov.permission.description,
    effect: ov.effect,
    scope: ov.scope,
    expiresAt: ov.expiresAt,
    isExpired: ov.expiresAt ? new Date(ov.expiresAt) < now : false,
    reason: ov.reason,
    createdBy: ov.createdBy,
    createdAt: ov.createdAt,
    updatedAt: ov.updatedAt,
  }));
};

/**
 * Revokes (deletes) a specific permission override for a user.
 *
 * @param {any} ctx - Auth and tenant context.
 * @param {string} userId - Target user identifier.
 * @param {string} overrideId - Override identifier to revoke.
 * @returns {Promise<any>}
 */
const revokeUserPermissionOverride = async (
  ctx: any,
  userId: string,
  overrideId: string,
) => {
  const instituteId = ctx?.instituteId;

  const override = await (prisma as any).userPermissionOverride.findFirst({
    where: {
      id: overrideId,
      userId,
      ...(instituteId ? { instituteId } : {}),
    },
    include: {
      permission: true,
    },
  });

  if (!override) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Permission override not found.");
  }

  await (prisma as any).userPermissionOverride.delete({
    where: { id: overrideId },
  });

  await logAudit({
    ctx,
    action: "USER_PERMISSION_OVERRIDE_DELETE",
    entityType: "UserPermissionOverride",
    entityId: overrideId,
    oldValue: override,
    newValue: null,
  });

  await invalidatePermissionCache(userId, override.instituteId);

  return {
    success: true,
    message: `Permission override for '${override.permission.resource}.${override.permission.action}' revoked successfully.`,
  };
};

/**
 * Explains and returns the full computed effective permissions for a user,
 * detailing role sources, active overrides, and denial reasons for UI "why can/can't" auditing.
 *
 * @param {any} ctx - Auth and tenant context.
 * @param {string} userId - Target user identifier.
 * @returns {Promise<any>}
 */
const getUserEffectivePermissions = async (ctx: any, userId: string) => {
  const instituteId = ctx?.instituteId;
  if (!instituteId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Institute context is required.");
  }

  const targetUser = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      status: true,
    },
  });

  if (!targetUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
  }

  // 1. Fetch effective permissions from the engine
  const effectiveMap = await getEffectivePermissions(userId, instituteId);

  // 2. Fetch user's assigned roles with permissions
  const userRoles = await (prisma as any).userRole.findMany({
    where: {
      userId,
      role: {
        OR: [{ instituteId }, { instituteId: null }],
      },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  // 3. Fetch user overrides
  const overrides = await (prisma as any).userPermissionOverride.findMany({
    where: { userId, instituteId },
    include: {
      permission: true,
      createdBy: {
        select: { id: true, firstName: true, lastName: true, displayName: true },
      },
    },
  });

  const now = new Date();
  const deniedCodes: string[] = [];
  const overrideGrantMap = new Map<string, any>();

  for (const ov of overrides) {
    if (ov.expiresAt && new Date(ov.expiresAt) < now) continue;
    const code = `${ov.permission.resource}.${ov.permission.action}`;
    if (ov.effect === "DENY") {
      deniedCodes.push(code);
    } else if (ov.effect === "GRANT") {
      overrideGrantMap.set(code, ov);
    }
  }

  // 4. Construct detailed explanation for each granted permission
  const explanationList = Array.from(effectiveMap.entries()).map(([code, scope]) => {
    const roleSources = userRoles
      .filter((ur: any) =>
        ur.role.permissions.some(
          (rp: any) => `${rp.permission.resource}.${rp.permission.action}` === code,
        ),
      )
      .map((ur: any) => {
        const matchingRp = ur.role.permissions.find(
          (rp: any) => `${rp.permission.resource}.${rp.permission.action}` === code,
        );
        return {
          roleId: ur.role.id,
          roleCode: ur.role.code,
          roleName: ur.role.name,
          scope: matchingRp.scope,
        };
      });

    const activeGrantOverride = overrideGrantMap.get(code);

    return {
      permissionCode: code,
      scope,
      decision: "ALLOWED",
      resolvedVia: activeGrantOverride ? "OVERRIDE_GRANT" : "ROLE_HIERARCHY",
      roleSources,
      override: activeGrantOverride
        ? {
            id: activeGrantOverride.id,
            effect: activeGrantOverride.effect,
            scope: activeGrantOverride.scope,
            reason: activeGrantOverride.reason,
            expiresAt: activeGrantOverride.expiresAt,
          }
        : null,
    };
  });

  return {
    user: targetUser,
    instituteId,
    totalEffectivePermissions: effectiveMap.size,
    effectivePermissions: explanationList,
    assignedRoles: userRoles.map((ur: any) => ({
      id: ur.role.id,
      name: ur.role.name,
      code: ur.role.code,
      isSystem: ur.role.isSystem,
      permissionsCount: ur.role.permissions.length,
    })),
    overrides: overrides.map((ov: any) => ({
      id: ov.id,
      permissionCode: `${ov.permission.resource}.${ov.permission.action}`,
      effect: ov.effect,
      scope: ov.scope,
      expiresAt: ov.expiresAt,
      isExpired: ov.expiresAt ? new Date(ov.expiresAt) < now : false,
      reason: ov.reason,
      createdBy: ov.createdBy,
    })),
    deniedPermissions: deniedCodes,
  };
};

export const UserService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  assignRole,
  revokeRole,
  grantUserPermission,
  listUserPermissionOverrides,
  revokeUserPermissionOverride,
  getUserEffectivePermissions,
};

export default UserService;
