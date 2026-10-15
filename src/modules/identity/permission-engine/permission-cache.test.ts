import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "../../../config/prisma.js";
import cacheHelper from "../../../utils/cache.js";
import {
  SCOPE_WEIGHT,
  mergeScopes,
  getEffectivePermissions,
  invalidatePermissionCache,
} from "./permission-cache.js";

vi.mock("../../../config/prisma.js", () => ({
  default: {
    userRole: {
      findMany: vi.fn(),
    },
    userPermissionOverride: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../../utils/cache.js", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    delByPattern: vi.fn(),
  },
}));

describe("Permission Cache: Effective Permissions & Scopes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("mergeScopes & SCOPE_WEIGHT", () => {
    it("verifies scope weights: OWN < ASSIGNED < INSTITUTE < ALL", () => {
      expect(SCOPE_WEIGHT.OWN).toBeLessThan(SCOPE_WEIGHT.ASSIGNED);
      expect(SCOPE_WEIGHT.ASSIGNED).toBeLessThan(SCOPE_WEIGHT.INSTITUTE);
      expect(SCOPE_WEIGHT.INSTITUTE).toBeLessThan(SCOPE_WEIGHT.ALL);
    });

    it("merges OWN and ASSIGNED -> ASSIGNED", () => {
      expect(mergeScopes("OWN", "ASSIGNED")).toBe("ASSIGNED");
      expect(mergeScopes("ASSIGNED", "OWN")).toBe("ASSIGNED");
    });

    it("merges ASSIGNED and INSTITUTE -> INSTITUTE", () => {
      expect(mergeScopes("ASSIGNED", "INSTITUTE")).toBe("INSTITUTE");
      expect(mergeScopes("INSTITUTE", "ASSIGNED")).toBe("INSTITUTE");
    });

    it("merges INSTITUTE and ALL -> ALL", () => {
      expect(mergeScopes("INSTITUTE", "ALL")).toBe("ALL");
      expect(mergeScopes("ALL", "INSTITUTE")).toBe("ALL");
    });
  });

  describe("getEffectivePermissions", () => {
    const userId = "u-123";
    const instituteId = "inst-456";

    it("returns cached map from Redis if present", async () => {
      (cacheHelper.get as any).mockResolvedValue({
        "academic.course.read": "INSTITUTE",
        "lms.course.update": "ASSIGNED",
      });

      const result = await getEffectivePermissions(userId, instituteId);
      expect(result.get("academic.course.read")).toBe("INSTITUTE");
      expect(result.get("lms.course.update")).toBe("ASSIGNED");
      expect(prisma.userRole.findMany).not.toHaveBeenCalled();
    });

    it("merges multiple roles and applies overrides with DENY taking precedence", async () => {
      (cacheHelper.get as any).mockResolvedValue(null);

      // User has 2 roles: Role 1 gives OWN, Role 2 gives INSTITUTE
      (prisma as any).userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              {
                scope: "OWN",
                permission: { resource: "lms.course", action: "read" },
              },
              {
                scope: "ASSIGNED",
                permission: { resource: "lms.course", action: "update" },
              },
            ],
          },
        },
        {
          role: {
            permissions: [
              {
                scope: "INSTITUTE",
                permission: { resource: "lms.course", action: "read" },
              },
            ],
          },
        },
      ]);

      // Overrides: DENY on lms.course.read, GRANT on saas.subscription.read
      (prisma as any).userPermissionOverride.findMany.mockResolvedValue([
        {
          effect: "DENY",
          expiresAt: null,
          permission: { resource: "lms.course", action: "read" },
        },
        {
          effect: "GRANT",
          scope: "ALL",
          expiresAt: null,
          permission: { resource: "saas.subscription", action: "read" },
        },
      ]);

      const result = await getEffectivePermissions(userId, instituteId);

      // lms.course.read was granted by both roles, but DENY override removes it
      expect(result.has("lms.course.read")).toBe(false);

      // lms.course.update was granted ASSIGNED by Role 1
      expect(result.get("lms.course.update")).toBe("ASSIGNED");

      // saas.subscription.read was granted by GRANT override
      expect(result.get("saas.subscription.read")).toBe("ALL");

      // Verified cached into Redis with TTL 300s
      expect(cacheHelper.set).toHaveBeenCalledWith(
        `perm:${userId}:${instituteId}`,
        expect.objectContaining({
          "lms.course.update": "ASSIGNED",
          "saas.subscription.read": "ALL",
        }),
        300,
      );
    });

    it("ignores expired overrides", async () => {
      (cacheHelper.get as any).mockResolvedValue(null);

      (prisma as any).userRole.findMany.mockResolvedValue([
        {
          role: {
            permissions: [
              {
                scope: "INSTITUTE",
                permission: { resource: "academic.course", action: "read" },
              },
            ],
          },
        },
      ]);

      (prisma as any).userPermissionOverride.findMany.mockResolvedValue([
        {
          effect: "DENY",
          expiresAt: new Date("2020-01-01"), // Expired
          permission: { resource: "academic.course", action: "read" },
        },
      ]);

      const result = await getEffectivePermissions(userId, instituteId);

      // Expired DENY override did not remove permission
      expect(result.get("academic.course.read")).toBe("INSTITUTE");
    });
  });

  describe("invalidatePermissionCache", () => {
    it("invalidates for specific userId and instituteId", async () => {
      await invalidatePermissionCache("u-1", "inst-1");
      expect(cacheHelper.del).toHaveBeenCalledWith("perm:u-1:inst-1");
    });

    it("invalidates across all institutes for a specific userId", async () => {
      await invalidatePermissionCache("u-1");
      expect(cacheHelper.delByPattern).toHaveBeenCalledWith("perm:u-1:*");
    });

    it("invalidates all users for an institute", async () => {
      await invalidatePermissionCache(undefined, "inst-1");
      expect(cacheHelper.delByPattern).toHaveBeenCalledWith("perm:*:inst-1");
    });

    it("invalidates all assigned users of a role", async () => {
      (prisma as any).userRole.findMany.mockResolvedValue([
        { userId: "u-1" },
        { userId: "u-2" },
      ]);

      await invalidatePermissionCache(undefined, "inst-1", "role-1");
      expect(cacheHelper.del).toHaveBeenCalledWith("perm:u-1:inst-1");
      expect(cacheHelper.del).toHaveBeenCalledWith("perm:u-2:inst-1");
    });
  });
});
