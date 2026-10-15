import { describe, it, test, expect, beforeEach, vi } from "vitest";
import prisma from "../../../config/prisma.js";
import { checkPrivilegeEscalation } from "./privilege-escalation.js";
import { getEffectivePermissions, invalidatePermissionCache } from "./permission-cache.js";
import { RoleService } from "../role/role.service.js";
import { UserService } from "../user/user.service.js";
import { PermissionService } from "../permission/permission.service.js";
import ApiError from "../../../utils/ApiError.js";

// Mock prisma and cache
vi.mock("../../../config/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    rolePermission: {
      findMany: vi.fn(),
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    userRole: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    permission: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    userPermissionOverride: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

vi.mock("../../../utils/audit.js", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
  extractAuditContext: vi.fn().mockReturnValue({}),
}));

vi.mock("./permission-cache.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./permission-cache.js")>();
  return {
    ...actual,
    getEffectivePermissions: vi.fn(),
    invalidatePermissionCache: vi.fn().mockResolvedValue(undefined),
  };
});

describe("STEP 4: Role & Permission Management - Privilege Escalation & Guards", () => {
  const mockTenantCtx = {
    userId: "usr_actor_111",
    instituteId: "inst_test_999",
    isPlatformAdmin: false,
  };

  const mockAdminCtx = {
    userId: "usr_superadmin_000",
    instituteId: "inst_test_999",
    isPlatformAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. checkPrivilegeEscalation Unit Tests
  // =========================================================================
  describe("checkPrivilegeEscalation() Guard", () => {
    it("should allow platform super admin unconditionally", async () => {
      await expect(
        checkPrivilegeEscalation(mockAdminCtx, [
          { permissionCode: "saas.institute.delete", scope: "ALL" },
        ]),
      ).resolves.toBeUndefined();
      expect(getEffectivePermissions).not.toHaveBeenCalled();
    });

    it("should throw 401 if userId or instituteId is missing", async () => {
      await expect(
        checkPrivilegeEscalation({ isPlatformAdmin: false }, [
          { permissionCode: "academic.program.read", scope: "INSTITUTE" },
        ]),
      ).rejects.toThrowError(ApiError);
    });

    it("should throw 403 when actor does not possess the requested permission", async () => {
      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["academic.program.read", "INSTITUTE"]]),
      );

      await expect(
        checkPrivilegeEscalation(mockTenantCtx, [
          { permissionCode: "academic.program.delete", scope: "INSTITUTE" },
        ]),
      ).rejects.toThrowError(/Privilege escalation detected: You cannot grant permission 'academic.program.delete' because you do not possess it/);
    });

    it("should throw 403 when actor attempts to grant a scope higher than their effective scope", async () => {
      // Actor only has OWN scope
      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["lms.course.update", "OWN"]]),
      );

      await expect(
        checkPrivilegeEscalation(mockTenantCtx, [
          { permissionCode: "lms.course.update", scope: "INSTITUTE" },
        ]),
      ).rejects.toThrowError(/Privilege escalation detected: You cannot grant permission 'lms.course.update' at scope 'INSTITUTE' because your effective scope is 'OWN'/);
    });

    it("should allow granting equal scope", async () => {
      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["lms.course.update", "INSTITUTE"]]),
      );

      await expect(
        checkPrivilegeEscalation(mockTenantCtx, [
          { permissionCode: "lms.course.update", scope: "INSTITUTE" },
        ]),
      ).resolves.toBeUndefined();
    });

    it("should allow granting lower scope", async () => {
      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["lms.course.update", "INSTITUTE"]]),
      );

      await expect(
        checkPrivilegeEscalation(mockTenantCtx, [
          { permissionCode: "lms.course.update", scope: "OWN" },
        ]),
      ).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // 2. RoleService: setRoleMatrix & Privilege Escalation
  // =========================================================================
  describe("RoleService.setRoleMatrix()", () => {
    it("should block non-admin attempting privilege escalation on role matrix", async () => {
      vi.mocked((prisma as any).role.findFirst).mockResolvedValueOnce({
        id: "role_123",
        name: "Custom Role",
        code: "CUSTOM_ROLE",
        instituteId: "inst_test_999",
        isSystem: false,
      });

      // Actor only possesses read permission
      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["academic.program.read", "INSTITUTE"]]),
      );

      await expect(
        RoleService.setRoleMatrix(
          "role_123",
          [
            { permissionCode: "academic.program.delete", scope: "INSTITUTE" },
          ],
          mockTenantCtx,
        ),
      ).rejects.toThrowError(/Privilege escalation detected/);
    });

    it("should successfully set matrix within actor permissions, audit diff, and invalidate cache", async () => {
      vi.mocked((prisma as any).role.findFirst).mockResolvedValueOnce({
        id: "role_123",
        name: "Custom Role",
        code: "CUSTOM_ROLE",
        instituteId: "inst_test_999",
        isSystem: false,
      });

      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["academic.program.read", "INSTITUTE"]]),
      );

      vi.mocked((prisma as any).rolePermission.findMany)
        .mockResolvedValueOnce([]) // oldPermissions
        .mockResolvedValueOnce([   // newPermissions after transaction
          {
            roleId: "role_123",
            permissionId: "perm_prog_read",
            scope: "INSTITUTE",
            permission: { resource: "academic.program", action: "read" },
          },
        ]);
      vi.mocked((prisma as any).permission.findMany).mockResolvedValueOnce([
        { id: "perm_prog_read", resource: "academic.program", action: "read" },
      ]);
      vi.mocked((prisma as any).rolePermission.createMany).mockResolvedValueOnce({ count: 1 });

      const result = await RoleService.setRoleMatrix(
        "role_123",
        [{ permissionCode: "academic.program.read", scope: "INSTITUTE" }],
        mockTenantCtx,
      );

      expect((prisma as any).rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: "role_123" },
      });
      expect(invalidatePermissionCache).toHaveBeenCalledWith(undefined, "inst_test_999", "role_123");
    });
  });

  // =========================================================================
  // 3. RoleService: System Role Protection & Safe Deletion
  // =========================================================================
  describe("RoleService System Role & Deletion Guards", () => {
    it("should block updating name or code of a system role", async () => {
      vi.mocked((prisma as any).role.findFirst).mockResolvedValueOnce({
        id: "role_sys_owner",
        name: "Institute Owner",
        code: "INSTITUTE_OWNER",
        isSystem: true,
      });

      await expect(
        RoleService.update("role_sys_owner", { name: "Renamed Owner" }, mockTenantCtx),
      ).rejects.toThrowError(/System roles cannot have their name modified/);
    });

    it("should permit updating description of a system role", async () => {
      vi.mocked((prisma as any).role.findFirst).mockResolvedValueOnce({
        id: "role_sys_owner",
        name: "Institute Owner",
        code: "INSTITUTE_OWNER",
        isSystem: true,
      });
      vi.mocked((prisma as any).role.update).mockResolvedValueOnce({
        id: "role_sys_owner",
        description: "Updated owner description",
      });

      const updated = await RoleService.update(
        "role_sys_owner",
        { description: "Updated owner description" },
        mockTenantCtx,
      );
      expect(updated.description).toBe("Updated owner description");
    });

    it("should block deleting a system role", async () => {
      vi.mocked((prisma as any).role.findFirst).mockResolvedValueOnce({
        id: "role_sys_admin",
        name: "Institute Admin",
        code: "INSTITUTE_ADMIN",
        isSystem: true,
      });

      await expect(
        RoleService.deleteById("role_sys_admin", undefined, mockTenantCtx),
      ).rejects.toThrowError(/System roles cannot be deleted/);
    });

    it("should block deleting a role that has assigned users if reassignToRoleId is missing", async () => {
      vi.mocked((prisma as any).role.findFirst).mockResolvedValueOnce({
        id: "role_custom",
        name: "Custom Role",
        code: "CUSTOM",
        isSystem: false,
      });
      vi.mocked((prisma as any).userRole.count).mockResolvedValueOnce(3);

      await expect(
        RoleService.deleteById("role_custom", undefined, mockTenantCtx),
      ).rejects.toThrowError(/Provide reassignToRoleId to reassign users before deleting/);
    });

    it("should reassign users and delete role when reassignToRoleId is provided", async () => {
      vi.mocked((prisma as any).role.findFirst)
        .mockResolvedValueOnce({
          id: "role_custom",
          name: "Old Role",
          code: "OLD_ROLE",
          isSystem: false,
        })
        .mockResolvedValueOnce({
          id: "role_target",
          name: "Target Role",
          code: "TARGET_ROLE",
          isSystem: false,
          permissions: [],
        });

      vi.mocked((prisma as any).userRole.count).mockResolvedValueOnce(2);
      vi.mocked((prisma as any).userRole.findMany).mockResolvedValueOnce([
        { userId: "usr_1" },
        { userId: "usr_2" },
      ]);
      vi.mocked((prisma as any).userRole.findUnique).mockResolvedValue(null);

      const result = await RoleService.deleteById(
        "role_custom",
        { reassignToRoleId: "role_target" },
        mockTenantCtx,
      );

      expect(result.success).toBe(true);
      expect((prisma as any).role.delete).toHaveBeenCalledWith({
        where: { id: "role_custom" },
      });
    });
  });

  // =========================================================================
  // 4. RoleService: Clone Role Privilege Escalation Check
  // =========================================================================
  describe("RoleService.create() with cloneFromRoleId", () => {
    it("should block cloning when source role has permissions exceeding actor's own", async () => {
      vi.mocked((prisma as any).role.findFirst)
        .mockResolvedValueOnce(null) // Uniqueness check passes
        .mockResolvedValueOnce({
          id: "role_owner",
          name: "Institute Owner",
          permissions: [
            {
              permission: { resource: "saas.institute", action: "delete" },
              scope: "ALL",
            },
          ],
        });

      // Actor only has student permissions
      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["lms.course.read", "INSTITUTE"]]),
      );

      await expect(
        RoleService.create(
          {
            name: "Escalated Role",
            code: "ESCALATED",
            cloneFromRoleId: "role_owner",
          },
          mockTenantCtx,
        ),
      ).rejects.toThrowError(/Privilege escalation detected/);
    });
  });

  // =========================================================================
  // 5. UserService: Role Assignment & Last Owner Guard
  // =========================================================================
  describe("UserService Role Assignment & Last Owner Guard", () => {
    it("should prevent non-admin from assigning a role with permissions exceeding actor's own", async () => {
      vi.mocked((prisma as any).user.findUnique).mockResolvedValueOnce({
        id: "usr_target",
      });
      vi.mocked((prisma as any).role.findFirst).mockResolvedValueOnce({
        id: "role_admin",
        name: "Admin Role",
        code: "INSTITUTE_ADMIN",
        permissions: [
          {
            permission: { resource: "saas.subscription", action: "create" },
            scope: "INSTITUTE",
          },
        ],
      });

      // Actor does not have saas.subscription.create
      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["academic.program.read", "INSTITUTE"]]),
      );

      await expect(
        UserService.assignRole(mockTenantCtx, "usr_target", "role_admin"),
      ).rejects.toThrowError(/Privilege escalation detected/);
    });

    it("should block revoking the role from the last active INSTITUTE_OWNER", async () => {
      vi.mocked((prisma as any).userRole.findUnique).mockResolvedValueOnce({
        userId: "usr_owner_1",
        roleId: "role_owner_id",
        role: {
          id: "role_owner_id",
          name: "Institute Owner",
          code: "INSTITUTE_OWNER",
        },
      });

      // Active owner count is 1 (only this user)
      vi.mocked((prisma as any).userRole.count).mockResolvedValueOnce(1);

      await expect(
        UserService.revokeRole(mockTenantCtx, "usr_owner_1", "role_owner_id"),
      ).rejects.toThrowError(/Cannot revoke role from the last active INSTITUTE_OWNER/);
    });

    it("should allow revoking INSTITUTE_OWNER when multiple active owners exist", async () => {
      vi.mocked((prisma as any).userRole.findUnique).mockResolvedValueOnce({
        userId: "usr_owner_1",
        roleId: "role_owner_id",
        role: {
          id: "role_owner_id",
          name: "Institute Owner",
          code: "INSTITUTE_OWNER",
        },
      });

      // Active owner count is 2
      vi.mocked((prisma as any).userRole.count).mockResolvedValueOnce(2);
      vi.mocked((prisma as any).userRole.delete).mockResolvedValueOnce({});

      const result = await UserService.revokeRole(
        mockTenantCtx,
        "usr_owner_1",
        "role_owner_id",
      );
      expect(result.success).toBe(true);
      expect(invalidatePermissionCache).toHaveBeenCalledWith("usr_owner_1", "inst_test_999");
    });
  });

  // =========================================================================
  // 6. UserService: Permission Overrides (GRANT / DENY)
  // =========================================================================
  describe("UserService Permission Overrides", () => {
    it("should block non-admin from GRANTing an override for permission they do not possess", async () => {
      vi.mocked((prisma as any).user.findUnique).mockResolvedValueOnce({ id: "usr_student" });
      vi.mocked((prisma as any).permission.findUnique).mockResolvedValueOnce({
        id: "perm_inst_del",
        resource: "saas.institute",
        action: "delete",
      });

      // Actor does not possess saas.institute.delete
      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["academic.program.read", "INSTITUTE"]]),
      );

      await expect(
        UserService.grantUserPermission(mockTenantCtx, "usr_student", {
          permissionCode: "saas.institute.delete",
          effect: "GRANT",
          scope: "ALL",
        }),
      ).rejects.toThrowError(/Privilege escalation detected/);
    });

    it("should allow DENY override even if actor has narrower permissions", async () => {
      vi.mocked((prisma as any).user.findUnique).mockResolvedValueOnce({ id: "usr_student" });
      vi.mocked((prisma as any).permission.findUnique).mockResolvedValueOnce({
        id: "perm_course_read",
        resource: "lms.course",
        action: "read",
      });
      vi.mocked((prisma as any).userPermissionOverride.findUnique).mockResolvedValueOnce(null);
      vi.mocked((prisma as any).userPermissionOverride.upsert).mockResolvedValueOnce({
        id: "override_123",
        effect: "DENY",
        permission: { resource: "lms.course", action: "read" },
      });

      const result = await UserService.grantUserPermission(mockTenantCtx, "usr_student", {
        permissionCode: "lms.course.read",
        effect: "DENY",
      });

      expect(result.effect).toBe("DENY");
      expect(invalidatePermissionCache).toHaveBeenCalledWith("usr_student", "inst_test_999");
    });
  });

  // =========================================================================
  // 7. UI "Why Can / Can't" Explainer
  // =========================================================================
  describe("UserService.getUserEffectivePermissions()", () => {
    it("should break down role sources and override influences", async () => {
      vi.mocked((prisma as any).user.findUnique).mockResolvedValueOnce({
        id: "usr_teacher",
        email: "teacher@test.com",
        firstName: "John",
        status: "ACTIVE",
      });

      vi.mocked(getEffectivePermissions).mockResolvedValueOnce(
        new Map([["lms.course.read", "INSTITUTE"]]),
      );

      vi.mocked((prisma as any).userRole.findMany).mockResolvedValueOnce([
        {
          role: {
            id: "role_teacher",
            name: "Teacher",
            code: "TEACHER",
            isSystem: true,
            permissions: [
              {
                scope: "INSTITUTE",
                permission: { resource: "lms.course", action: "read" },
              },
            ],
          },
        },
      ]);

      vi.mocked((prisma as any).userPermissionOverride.findMany).mockResolvedValueOnce([]);

      const result = await UserService.getUserEffectivePermissions(
        mockTenantCtx,
        "usr_teacher",
      );

      expect(result.totalEffectivePermissions).toBe(1);
      expect(result.effectivePermissions[0].permissionCode).toBe("lms.course.read");
      expect(result.effectivePermissions[0].resolvedVia).toBe("ROLE_HIERARCHY");
      expect(result.effectivePermissions[0].roleSources[0].roleCode).toBe("TEACHER");
    });
  });

  // =========================================================================
  // 8. Permission Catalog Listing
  // =========================================================================
  describe("PermissionService.listCatalog()", () => {
    it("should return catalog grouped by module and resource", async () => {
      const catalog = await PermissionService.listCatalog();
      expect(catalog.total).toBeGreaterThan(150);
      expect(Array.isArray(catalog.modules)).toBe(true);
      const saasModule = catalog.modules.find((m: any) => m.module === "saas");
      expect(saasModule).toBeDefined();
      expect(saasModule!.resources.length).toBeGreaterThan(0);
    });
  });
});
