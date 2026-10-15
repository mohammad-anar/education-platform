import { StatusCodes } from "http-status-codes";
import ApiError from "../../../utils/ApiError.js";
import { PermissionScope } from "./permission-catalog.js";
import { getEffectivePermissions, SCOPE_WEIGHT } from "./permission-cache.js";

export interface IPermissionScopeGrant {
  permissionCode: string;
  scope: PermissionScope;
}

/**
 * Validates that an acting user is not attempting to grant or assign permissions/scopes
 * that exceed their own effective permissions within the tenant institute (privilege escalation check).
 *
 * Rules:
 * 1. Platform Super Admin (ctx.isPlatformAdmin === true) is exempt from privilege escalation checks.
 * 2. Actor must possess the exact permissionCode. If missing, throws 403 FORBIDDEN.
 * 3. Actor's effective scope weight must be >= the granted scope weight. If lower, throws 403 FORBIDDEN.
 *
 * @param ctx - The auth/audit context containing userId, instituteId, and isPlatformAdmin flag.
 * @param grants - Array of permission codes and scopes being granted or assigned.
 * @throws {ApiError} 403 Forbidden with details if privilege escalation is detected.
 */
export const checkPrivilegeEscalation = async (
  ctx: { userId?: string; instituteId?: string; isPlatformAdmin?: boolean },
  grants: IPermissionScopeGrant[],
): Promise<void> => {
  if (ctx.isPlatformAdmin) {
    return;
  }

  if (!ctx.userId || !ctx.instituteId) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Authentication and tenant context are required for privilege verification",
    );
  }

  const actorPermMap = await getEffectivePermissions(ctx.userId, ctx.instituteId);

  for (const grant of grants) {
    const actorScope = actorPermMap.get(grant.permissionCode);

    if (!actorScope) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Privilege escalation detected: You cannot grant permission '${grant.permissionCode}' because you do not possess it.`,
      );
    }

    if (SCOPE_WEIGHT[grant.scope] > SCOPE_WEIGHT[actorScope]) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Privilege escalation detected: You cannot grant permission '${grant.permissionCode}' at scope '${grant.scope}' because your effective scope is '${actorScope}'.`,
      );
    }
  }
};

export default {
  checkPrivilegeEscalation,
};
