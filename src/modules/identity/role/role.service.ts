import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IRoleFilterRequest } from "./role.interface.js";
import { logAudit } from "../../../utils/audit.js";
import { invalidatePermissionCache } from "../permission-engine/permission-cache.js";
import { checkPrivilegeEscalation } from "../permission-engine/privilege-escalation.js";
import { PermissionScope } from "../permission-engine/permission-catalog.js";

/**
 * Creates a new Role with optional cloning from an existing role and logs an audit record.
 * Enforces tenant isolation and privilege escalation checks on cloned roles.
 *
 * @param {any} payload - The role creation data ({ name, code, description, cloneFromRoleId? }).
 * @param {any} [ctx] - Auth and audit context.
 * @returns {Promise<any>} The newly created role with cloned permissions if applicable.
 */
const create = async (payload: any, ctx?: any) => {
  const instituteId = ctx?.isPlatformAdmin
    ? payload.instituteId || ctx?.instituteId || null
    : ctx?.instituteId || null;

  const roleCode = payload.code.toUpperCase().trim();

  // Check unique [instituteId, code]
  const existingRole = await (prisma as any).role.findFirst({
    where: {
      instituteId,
      code: roleCode,
    },
  });

  if (existingRole) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      `A role with code '${roleCode}' already exists for this institute.`,
    );
  }

  let sourceRole: any = null;
  if (payload.cloneFromRoleId) {
    sourceRole = await (prisma as any).role.findFirst({
      where: {
        id: payload.cloneFromRoleId,
        OR: [{ instituteId }, { instituteId: null }],
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!sourceRole) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Clone source role not found.");
    }

    // Privilege escalation check: user cannot clone a role that exceeds their effective permissions
    if (ctx?.userId && !ctx?.isPlatformAdmin && sourceRole.permissions?.length > 0) {
      const grantsToCheck = sourceRole.permissions.map((sp: any) => ({
        permissionCode: `${sp.permission.resource}.${sp.permission.action}`,
        scope: sp.scope as PermissionScope,
      }));
      await checkPrivilegeEscalation(ctx, grantsToCheck);
    }
  }

  const result = await (prisma as any).$transaction(async (tx: any) => {
    const created = await tx.role.create({
      data: {
        name: payload.name.trim(),
        code: roleCode,
        description: payload.description,
        instituteId,
        isSystem: false,
      },
    });

    if (sourceRole && sourceRole.permissions?.length > 0) {
      await tx.rolePermission.createMany({
        data: sourceRole.permissions.map((sp: any) => ({
          roleId: created.id,
          permissionId: sp.permissionId,
          scope: sp.scope,
        })),
      });
    }

    return tx.role.findUnique({
      where: { id: created.id },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });
  });

  await logAudit({
    ctx,
    action: "ROLE_CREATE",
    entityType: "Role",
    entityId: result.id,
    newValue: result,
  });

  return result;
};

/**
 * Retrieves paginated roles based on filter criteria.
 *
 * @param {IRoleFilterRequest} filters - Filter criteria.
 * @param {IPaginationOptions} paginationOptions - Pagination and sorting options.
 * @param {any} [ctx] - Auth and tenant context.
 * @returns {Promise<{ meta: any; data: any[] }>}
 */
const getAll = async (
  filters: IRoleFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.OR = [{ instituteId: ctx.instituteId }, { instituteId: null }];
  }

  const result = await (prisma as any).role.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  const total = await (prisma as any).role.count({
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

/**
 * Retrieves a single role by its unique identifier.
 *
 * @param {string} id - The role identifier.
 * @param {any} [ctx] - Auth and tenant context.
 * @returns {Promise<any>}
 */
const getById = async (id: string, ctx?: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.OR = [{ instituteId: ctx.instituteId }, { instituteId: null }];
  }

  const result = await (prisma as any).role.findFirst({
    where: whereConditions,
    include: {
      permissions: {
        include: { permission: true },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role not found.");
  }

  return result;
};

/**
 * Updates an existing role and logs an audit record with diff.
 * Blocks modification of name or code on system roles (only description allowed).
 *
 * @param {string} id - The role identifier.
 * @param {any} payload - Update fields.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const update = async (id: string, payload: any, ctx?: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.OR = [{ instituteId: ctx.instituteId }, { instituteId: null }];
  }

  const oldRole = await (prisma as any).role.findFirst({
    where: whereConditions,
  });

  if (!oldRole) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role not found.");
  }

  // Block isSystem edits except description
  if (oldRole.isSystem) {
    if (payload.name && payload.name !== oldRole.name) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "System roles cannot have their name modified. Only description may be updated.",
      );
    }
    if (payload.code && payload.code.toUpperCase() !== oldRole.code) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        "System roles cannot have their code modified. Only description may be updated.",
      );
    }
  }

  const updateData: any = {};
  if (payload.description !== undefined) {
    updateData.description = payload.description;
  }
  if (!oldRole.isSystem) {
    if (payload.name) updateData.name = payload.name.trim();
    if (payload.code) updateData.code = payload.code.toUpperCase().trim();
  }

  const result = await (prisma as any).role.update({
    where: { id },
    data: updateData,
  });

  await logAudit({
    ctx,
    action: "ROLE_UPDATE",
    entityType: "Role",
    entityId: id,
    oldValue: oldRole,
    newValue: result,
  });

  await invalidatePermissionCache(undefined, oldRole.instituteId || ctx?.instituteId, id);

  return result;
};

/**
 * Deletes a role and logs an audit record.
 * Blocks deletion if the role is a system role or has assigned users (unless reassignToRoleId is provided).
 *
 * @param {string} id - The role identifier.
 * @param {any} [options] - Deletion options including optional reassignToRoleId.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const deleteById = async (
  id: string,
  options?: { reassignToRoleId?: string },
  ctx?: any,
) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.OR = [{ instituteId: ctx.instituteId }, { instituteId: null }];
  }

  const oldRole = await (prisma as any).role.findFirst({
    where: whereConditions,
  });

  if (!oldRole) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role not found.");
  }

  if (oldRole.isSystem) {
    throw new ApiError(StatusCodes.FORBIDDEN, "System roles cannot be deleted.");
  }

  const userCount = await (prisma as any).userRole.count({
    where: { roleId: id },
  });

  if (userCount > 0) {
    if (!options?.reassignToRoleId) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Role is currently assigned to ${userCount} users. Provide reassignToRoleId to reassign users before deleting.`,
      );
    }

    const targetRoleId = options.reassignToRoleId;
    if (targetRoleId === id) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Cannot reassign users to the role being deleted.",
      );
    }

    const targetRole = await (prisma as any).role.findFirst({
      where: {
        id: targetRoleId,
        OR: [{ instituteId: ctx?.instituteId }, { instituteId: null }],
      },
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (!targetRole) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Reassignment target role not found.");
    }

    // Privilege escalation check on target role:
    // Non-admin user cannot reassign users to a role granting permissions exceeding actor's permissions
    if (ctx?.userId && !ctx?.isPlatformAdmin && targetRole.permissions?.length > 0) {
      const targetGrants = targetRole.permissions.map((rp: any) => ({
        permissionCode: `${rp.permission.resource}.${rp.permission.action}`,
        scope: rp.scope as PermissionScope,
      }));
      await checkPrivilegeEscalation(ctx, targetGrants);
    }

    // Transactional reassignment & deletion
    await (prisma as any).$transaction(async (tx: any) => {
      const assignedUsers = await tx.userRole.findMany({
        where: { roleId: id },
      });

      for (const ur of assignedUsers) {
        const alreadyHasTarget = await tx.userRole.findUnique({
          where: {
            userId_roleId: {
              userId: ur.userId,
              roleId: targetRoleId,
            },
          },
        });

        if (!alreadyHasTarget) {
          await tx.userRole.create({
            data: {
              userId: ur.userId,
              roleId: targetRoleId,
            },
          });
        }
      }

      await tx.userRole.deleteMany({
        where: { roleId: id },
      });

      await tx.role.delete({
        where: { id },
      });
    });

    await logAudit({
      ctx,
      action: "ROLE_DELETE",
      entityType: "Role",
      entityId: id,
      oldValue: {
        role: oldRole,
        reassignedToRoleId: targetRoleId,
        affectedUsers: userCount,
      },
      newValue: null,
    });

    await invalidatePermissionCache(undefined, oldRole.instituteId || ctx?.instituteId, id);
    await invalidatePermissionCache(undefined, targetRole.instituteId || ctx?.instituteId, targetRoleId);

    return {
      success: true,
      message: `Role deleted successfully and ${userCount} users reassigned to '${targetRole.name}'.`,
    };
  }

  // No assigned users; direct deletion
  const result = await (prisma as any).role.delete({
    where: { id },
  });

  await logAudit({
    ctx,
    action: "ROLE_DELETE",
    entityType: "Role",
    entityId: id,
    oldValue: oldRole,
    newValue: null,
  });

  await invalidatePermissionCache(undefined, oldRole.instituteId || ctx?.instituteId, id);

  return result;
};

/**
 * Retrieves the full permission matrix for a role, mapping every system permission
 * to its assigned scope or null if unassigned.
 *
 * @param {string} roleId - The role identifier.
 * @param {any} [ctx] - Auth and tenant context.
 * @returns {Promise<{ roleId: string; roleName: string; roleCode: string; isSystem: boolean; matrix: any[] }>}
 */
const getRoleMatrix = async (roleId: string, ctx?: any) => {
  const whereConditions: any = { id: roleId };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.OR = [{ instituteId: ctx.instituteId }, { instituteId: null }];
  }

  const role = await (prisma as any).role.findFirst({
    where: whereConditions,
  });

  if (!role) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role not found.");
  }

  const allPermissions = await (prisma as any).permission.findMany({
    orderBy: [{ resource: "asc" }, { action: "asc" }],
  });

  const rolePermissions = await (prisma as any).rolePermission.findMany({
    where: { roleId },
  });

  const assignedMap = new Map<string, PermissionScope>();
  for (const rp of rolePermissions) {
    assignedMap.set(rp.permissionId, rp.scope as PermissionScope);
  }

  const matrix = allPermissions.map((p: any) => {
    const code = `${p.resource}.${p.action}`;
    return {
      permissionId: p.id,
      code,
      resource: p.resource,
      action: p.action,
      description: p.description,
      scope: assignedMap.get(p.id) || null,
    };
  });

  return {
    roleId: role.id,
    roleName: role.name,
    roleCode: role.code,
    isSystem: role.isSystem,
    matrix,
  };
};

/**
 * Bulk updates the permission matrix for a role with transactional diff auditing,
 * cache invalidation, and privilege escalation prevention.
 *
 * @param {string} roleId - The role identifier.
 * @param {Array<{ permissionCode: string; scope: PermissionScope | null }>} permissions - Array of permission configs.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const setRoleMatrix = async (
  roleId: string,
  permissions: Array<{ permissionCode: string; scope: PermissionScope | null }>,
  ctx?: any,
) => {
  const whereConditions: any = { id: roleId };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.OR = [{ instituteId: ctx.instituteId }, { instituteId: null }];
  }

  const role = await (prisma as any).role.findFirst({
    where: whereConditions,
  });

  if (!role) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role not found.");
  }

  const activeGrantsToSet = permissions.filter(
    (p) => p.scope !== null && p.scope !== undefined,
  ) as Array<{ permissionCode: string; scope: PermissionScope }>;

  // Privilege escalation check: Actor cannot grant permissions or scopes exceeding their own
  if (ctx?.userId && !ctx?.isPlatformAdmin && activeGrantsToSet.length > 0) {
    await checkPrivilegeEscalation(ctx, activeGrantsToSet);
  }

  const oldPermissions = await (prisma as any).rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });

  const dbPerms = await (prisma as any).permission.findMany({
    select: { id: true, resource: true, action: true },
  });

  const permMap = new Map<string, string>();
  for (const p of dbPerms) {
    permMap.set(`${p.resource}.${p.action}`, p.id);
  }

  const result = await (prisma as any).$transaction(async (tx: any) => {
    await tx.rolePermission.deleteMany({
      where: { roleId },
    });

    if (activeGrantsToSet.length > 0) {
      const recordsToInsert: Array<{ roleId: string; permissionId: string; scope: any }> = [];
      for (const item of activeGrantsToSet) {
        const permId = permMap.get(item.permissionCode);
        if (permId) {
          recordsToInsert.push({
            roleId,
            permissionId: permId,
            scope: item.scope,
          });
        }
      }

      if (recordsToInsert.length > 0) {
        await tx.rolePermission.createMany({
          data: recordsToInsert,
        });
      }
    }

    return tx.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
  });

  await logAudit({
    ctx,
    action: "ROLE_PERMISSION_CHANGE",
    entityType: "RolePermission",
    entityId: roleId,
    oldValue: oldPermissions.map((rp: any) => ({
      code: `${rp.permission.resource}.${rp.permission.action}`,
      scope: rp.scope,
    })),
    newValue: (result || []).map((rp: any) => ({
      code: `${rp.permission.resource}.${rp.permission.action}`,
      scope: rp.scope,
    })),
  });

  await invalidatePermissionCache(undefined, role.instituteId || ctx?.instituteId, roleId);

  return result;
};

/**
 * Previews the impact of modifying or deleting a role by returning user count and user summary.
 *
 * @param {string} roleId - The role identifier.
 * @param {any} [ctx] - Auth and tenant context.
 * @returns {Promise<{ roleId: string; roleName: string; roleCode: string; userCount: number; users: any[] }>}
 */
const previewRoleImpact = async (roleId: string, ctx?: any) => {
  const whereConditions: any = { id: roleId };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.OR = [{ instituteId: ctx.instituteId }, { instituteId: null }];
  }

  const role = await (prisma as any).role.findFirst({
    where: whereConditions,
  });

  if (!role) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Role not found.");
  }

  const userRoles = await (prisma as any).userRole.findMany({
    where: { roleId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true,
          status: true,
        },
      },
    },
  });

  return {
    roleId: role.id,
    roleName: role.name,
    roleCode: role.code,
    isSystem: role.isSystem,
    userCount: userRoles.length,
    users: userRoles.map((ur: any) => ur.user),
  };
};

export const RoleService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  getRoleMatrix,
  setRoleMatrix,
  previewRoleImpact,
  updateRolePermissions: setRoleMatrix, // Backward compatibility alias
};

export default RoleService;
