/**
 * Permission Engine Module
 * Unified export point for permission catalog, seeding, caching, evaluation, and scope resolution.
 */

export * from "./permission-catalog.js";
export * from "./permission-seed.js";
export * from "./permission-cache.js";
export * from "./scope-resolver.js";
export * from "./permission-evaluator.js";
export * from "./privilege-escalation.js";

import { buildPermissionCatalog, PERMISSION_CATALOG } from "./permission-catalog.js";
import { seedPermissions, seedSystemRoles, seedPlatformRole } from "./permission-seed.js";
import { getEffectivePermissions, invalidatePermissionCache } from "./permission-cache.js";
import { resolveAssignedScope, buildScopeWhere } from "./scope-resolver.js";
import { can } from "./permission-evaluator.js";

export const PermissionEngine = {
  buildPermissionCatalog,
  PERMISSION_CATALOG,
  seedPermissions,
  seedSystemRoles,
  seedPlatformRole,
  getEffectivePermissions,
  invalidatePermissionCache,
  resolveAssignedScope,
  buildScopeWhere,
  can,
};

export default PermissionEngine;
