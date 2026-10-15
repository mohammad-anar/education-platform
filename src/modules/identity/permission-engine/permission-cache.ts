import prisma from "../../../config/prisma.js";
import cacheHelper from "../../../utils/cache.js";
import logger from "../../../utils/logger.js";
import { PermissionScope } from "./permission-catalog.js";

/**
 * Numeric weight hierarchy for permission scopes. Higher numeric value represents broader access.
 */
export const SCOPE_WEIGHT: Record<PermissionScope, number> = {
  OWN: 1,
  ASSIGNED: 2,
  INSTITUTE: 3,
  ALL: 4,
};

/**
 * Evaluates which scope is wider between two permission scopes.
 *
 * @param {PermissionScope} scopeA - First scope.
 * @param {PermissionScope} scopeB - Second scope.
 * @returns {PermissionScope} The scope with the broader authorization level.
 */
export const mergeScopes = (
  scopeA: PermissionScope,
  scopeB: PermissionScope,
): PermissionScope => {
  return SCOPE_WEIGHT[scopeA] >= SCOPE_WEIGHT[scopeB] ? scopeA : scopeB;
};

/**
 * Builds the effective permission map for a specific user within a tenant institute.
 * Merges all assigned roles (highest scope wins), then overlays UserPermissionOverride rules
 * (DENY overrides unconditionally win; expired overrides are ignored).
 * Results are cached in Redis with a 300s TTL under key `perm:{userId}:{instituteId}`.
 *
 * @param {string} userId - The user's unique identifier.
 * @param {string} instituteId - The tenant institute's unique identifier.
 * @returns {Promise<Map<string, PermissionScope>>} Map of permission code to granted scope.
 */
export const getEffectivePermissions = async (
  userId: string,
  instituteId: string,
): Promise<Map<string, PermissionScope>> => {
  const cacheKey = `perm:${userId}:${instituteId}`;

  // 1. Check Redis Cache
  try {
    const cached = await cacheHelper.get<Record<string, PermissionScope>>(cacheKey);
    if (cached) {
      return new Map<string, PermissionScope>(Object.entries(cached));
    }
  } catch (err: any) {
    logger.warn(`[PERM_CACHE] Failed to read permissions from cache for ${cacheKey}:`, err.message);
  }

  // 2. Query User's Roles applicable to this institute (or global platform roles where instituteId is null)
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
            include: {
              permission: true,
            },
          },
        },
      },
    },
  });

  const effectiveMap = new Map<string, PermissionScope>();

  // 3. Merge role permissions (Highest scope wins)
  for (const ur of userRoles) {
    const role = ur.role;
    if (!role || !role.permissions) continue;

    for (const rp of role.permissions) {
      if (!rp.permission) continue;
      const code = `${rp.permission.resource}.${rp.permission.action}`;
      const scope = rp.scope as PermissionScope;

      if (effectiveMap.has(code)) {
        const currentScope = effectiveMap.get(code)!;
        effectiveMap.set(code, mergeScopes(currentScope, scope));
      } else {
        effectiveMap.set(code, scope);
      }
    }
  }

  // 4. Query and apply UserPermissionOverride records for this user and institute
  const overrides = await (prisma as any).userPermissionOverride.findMany({
    where: {
      userId,
      instituteId,
    },
    include: {
      permission: true,
    },
  });

  const now = new Date();
  const deniedCodes = new Set<string>();

  // First pass: Process DENY overrides (DENY strictly wins over GRANT and roles)
  for (const ov of overrides) {
    if (ov.expiresAt && new Date(ov.expiresAt) < now) continue; // Ignore expired
    if (!ov.permission) continue;

    const code = `${ov.permission.resource}.${ov.permission.action}`;
    if (ov.effect === "DENY") {
      deniedCodes.add(code);
      effectiveMap.delete(code);
    }
  }

  // Second pass: Process GRANT overrides
  for (const ov of overrides) {
    if (ov.expiresAt && new Date(ov.expiresAt) < now) continue;
    if (!ov.permission) continue;

    const code = `${ov.permission.resource}.${ov.permission.action}`;
    if (ov.effect === "GRANT" && !deniedCodes.has(code)) {
      const overrideScope = ov.scope as PermissionScope;
      effectiveMap.set(code, overrideScope);
    }
  }

  // 5. Store into Redis Cache with TTL 300s
  try {
    const serialized = Object.fromEntries(effectiveMap);
    await cacheHelper.set(cacheKey, serialized, 300);
  } catch (err: any) {
    logger.warn(`[PERM_CACHE] Failed to cache permissions for ${cacheKey}:`, err.message);
  }

  return effectiveMap;
};

/**
 * Invalidates the cached effective permissions in Redis.
 * Called on role assignment changes, permission override mutations, or role updates.
 *
 * @param {string} [userId] - Optional user identifier to invalidate.
 * @param {string} [instituteId] - Optional institute identifier to invalidate.
 * @param {string} [roleId] - Optional role identifier whose assigned users should be invalidated.
 * @returns {Promise<void>}
 */
export const invalidatePermissionCache = async (
  userId?: string,
  instituteId?: string,
  roleId?: string,
): Promise<void> => {
  try {
    if (roleId) {
      const assignedUsers = await (prisma as any).userRole.findMany({
        where: { roleId },
        select: { userId: true },
      });

      for (const ur of assignedUsers) {
        if (instituteId) {
          await cacheHelper.del(`perm:${ur.userId}:${instituteId}`);
        } else {
          await cacheHelper.delByPattern(`perm:${ur.userId}:*`);
        }
      }
      return;
    }

    if (userId && instituteId) {
      await cacheHelper.del(`perm:${userId}:${instituteId}`);
      return;
    }

    if (userId) {
      await cacheHelper.delByPattern(`perm:${userId}:*`);
      return;
    }

    if (instituteId) {
      await cacheHelper.delByPattern(`perm:*:${instituteId}`);
      return;
    }

    // Default: flush all permission caches
    await cacheHelper.delByPattern("perm:*");
  } catch (err: any) {
    logger.error("[PERM_CACHE_INVALIDATE] Failed to invalidate permission cache:", err.message);
  }
};

export default {
  SCOPE_WEIGHT,
  mergeScopes,
  getEffectivePermissions,
  invalidatePermissionCache,
};
