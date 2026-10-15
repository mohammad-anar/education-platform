import { describe, it, test, expect, beforeEach, vi } from "vitest";
import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../utils/audit.js";
import { can, ICanResult } from "./permission-evaluator.js";
import { getEffectivePermissions } from "./permission-cache.js";
import { resolveAssignedScope } from "./scope-resolver.js";
import { PermissionScope } from "./permission-catalog.js";

// Mock external dependencies
vi.mock("../../../config/prisma.js", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    userRole: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    instituteMembership: {
      findUnique: vi.fn(),
    },
    institute: {
      findUnique: vi.fn(),
    },
    userPermissionOverride: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../../utils/audit.js", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./permission-cache.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./permission-cache.js")>();
  return {
    ...actual,
    getEffectivePermissions: vi.fn(),
  };
});

vi.mock("./scope-resolver.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./scope-resolver.js")>();
  return {
    ...actual,
    resolveAssignedScope: vi.fn(),
  };
});

interface ITestCase {
  id: number;
  description: string;
  ctx: {
    userId: string;
    instituteId?: string;
  };
  code: string;
  resource?: any;
  setup: () => void;
  expected: ICanResult;
}

describe("Permission Evaluator: can() - Unit Test Matrix", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testCases: ITestCase[] = [
    // 1. Authentication Status Checks
    {
      id: 1,
      description: "Reject unauthenticated context (missing userId)",
      ctx: { userId: "", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {},
      expected: { allowed: false, reason: "UNAUTHENTICATED" },
    },
    {
      id: 2,
      description: "Reject if user record does not exist in database",
      ctx: { userId: "user-missing", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue(null);
      },
      expected: { allowed: false, reason: "USER_NOT_FOUND" },
    },
    {
      id: 3,
      description: "Reject soft-deleted user (deletedAt is set)",
      ctx: { userId: "user-deleted", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({
          status: "ACTIVE",
          deletedAt: new Date("2026-01-01"),
        });
      },
      expected: { allowed: false, reason: "USER_DELETED" },
    },
    {
      id: 4,
      description: "Reject inactive user (status = INACTIVE)",
      ctx: { userId: "user-inactive", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({
          status: "INACTIVE",
          deletedAt: null,
        });
      },
      expected: { allowed: false, reason: "USER_INACTIVE" },
    },
    {
      id: 5,
      description: "Reject suspended user (status = SUSPENDED)",
      ctx: { userId: "user-suspended", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({
          status: "SUSPENDED",
          deletedAt: null,
        });
      },
      expected: { allowed: false, reason: "USER_SUSPENDED" },
    },

    // 2. Platform Admin Bypass (No role-name check; relational check)
    {
      id: 6,
      description: "Allow platform super admin bypass via system role without tenant isolation (audited)",
      ctx: { userId: "platform-admin", instituteId: "inst-100" },
      code: "lms.course.delete",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({
          status: "ACTIVE",
          deletedAt: null,
        });
        (prisma as any).userRole.findFirst.mockResolvedValue({
          id: "ur-admin",
          role: { instituteId: null, isSystem: true },
        });
      },
      expected: { allowed: true, scope: "ALL", reason: "PLATFORM_ADMIN_BYPASS" },
    },

    // 3. Tenant Membership & Institute Status Checks
    {
      id: 7,
      description: "Reject if user has no membership in tenant institute",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue(null);
      },
      expected: { allowed: false, reason: "MEMBERSHIP_INACTIVE" },
    },
    {
      id: 8,
      description: "Reject if user membership is not ACTIVE (e.g. SUSPENDED)",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "SUSPENDED" });
      },
      expected: { allowed: false, reason: "MEMBERSHIP_INACTIVE" },
    },
    {
      id: 9,
      description: "Reject if institute record is not found",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue(null);
      },
      expected: { allowed: false, reason: "INSTITUTE_INACTIVE" },
    },
    {
      id: 10,
      description: "Reject if institute is soft-deleted",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({
          status: "ACTIVE",
          deletedAt: new Date("2026-02-01"),
        });
      },
      expected: { allowed: false, reason: "INSTITUTE_INACTIVE" },
    },
    {
      id: 11,
      description: "Reject if institute status is INACTIVE",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({
          status: "INACTIVE",
          deletedAt: null,
        });
      },
      expected: { allowed: false, reason: "INSTITUTE_INACTIVE" },
    },
    {
      id: 12,
      description: "Reject tenant operation when instituteId is omitted and user is not platform admin",
      ctx: { userId: "user-1" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
      },
      expected: { allowed: false, reason: "TENANT_CONTEXT_REQUIRED" },
    },

    // 4. User Permission Overrides (DENY / GRANT)
    {
      id: 13,
      description: "Active DENY override unconditionally blocks access even if granted by roles",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "lms.course.create",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([
          {
            effect: "DENY",
            expiresAt: null,
            permission: { resource: "lms.course", action: "create" },
          },
        ]);
      },
      expected: { allowed: false, reason: "OVERRIDE_DENIED" },
    },
    {
      id: 14,
      description: "Expired DENY override is ignored and role permission is respected",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "lms.course.create",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([
          {
            effect: "DENY",
            expiresAt: new Date("2020-01-01"), // Expired
            permission: { resource: "lms.course", action: "create" },
          },
        ]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.course.create", "INSTITUTE"]]),
        );
      },
      expected: { allowed: true, scope: "INSTITUTE" },
    },
    {
      id: 15,
      description: "Active GRANT override grants access even if roles do not grant the permission",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.delete",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([
          {
            effect: "GRANT",
            scope: "INSTITUTE",
            expiresAt: null,
            permission: { resource: "academic.course", action: "delete" },
          },
        ]);
      },
      expected: { allowed: true, scope: "INSTITUTE" },
    },
    {
      id: 16,
      description: "DENY override wins when both GRANT and DENY overrides are defined for the same code",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.delete",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([
          {
            effect: "DENY",
            expiresAt: null,
            permission: { resource: "academic.course", action: "delete" },
          },
          {
            effect: "GRANT",
            scope: "INSTITUTE",
            expiresAt: null,
            permission: { resource: "academic.course", action: "delete" },
          },
        ]);
      },
      expected: { allowed: false, reason: "OVERRIDE_DENIED" },
    },
    {
      id: 17,
      description: "Expired GRANT override is ignored and ungranted code is denied",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.delete",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([
          {
            effect: "GRANT",
            scope: "INSTITUTE",
            expiresAt: new Date("2020-01-01"), // Expired
            permission: { resource: "academic.course", action: "delete" },
          },
        ]);
        (getEffectivePermissions as any).mockResolvedValue(new Map());
      },
      expected: { allowed: false, reason: "PERMISSION_NOT_GRANTED" },
    },

    // 5. Effective Role Permission Matching
    {
      id: 18,
      description: "Reject permission when not present in user's roles or overrides",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "saas.subscription.delete",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(new Map());
      },
      expected: { allowed: false, reason: "PERMISSION_NOT_GRANTED" },
    },
    {
      id: 19,
      description: "Allow permission granted with OWN scope when no resource instance is provided",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "platform.notification.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["platform.notification.read", "OWN"]]),
        );
      },
      expected: { allowed: true, scope: "OWN" },
    },
    {
      id: 20,
      description: "Allow permission granted with ASSIGNED scope when no resource instance is provided",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "assessment.exam.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["assessment.exam.read", "ASSIGNED"]]),
        );
      },
      expected: { allowed: true, scope: "ASSIGNED" },
    },
    {
      id: 21,
      description: "Allow permission granted with INSTITUTE scope when no resource instance is provided",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["academic.course.read", "INSTITUTE"]]),
        );
      },
      expected: { allowed: true, scope: "INSTITUTE" },
    },
    {
      id: 22,
      description: "Role scope union: highest scope wins when multiple roles grant permission (OWN + INSTITUTE -> INSTITUTE)",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "lms.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        // Simulates effective permission map having merged OWN and INSTITUTE -> INSTITUTE wins
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.course.read", "INSTITUTE"]]),
        );
      },
      expected: { allowed: true, scope: "INSTITUTE" },
    },
    {
      id: 23,
      description: "Role scope union: ASSIGNED + ALL -> ALL wins",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "lms.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(new Map([["lms.course.read", "ALL"]]));
      },
      expected: { allowed: true, scope: "ALL" },
    },
    {
      id: 24,
      description: "Wildcard module matching: 'academic.*' grants 'academic.course.read'",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(new Map([["academic.*", "INSTITUTE"]]));
      },
      expected: { allowed: true, scope: "INSTITUTE" },
    },
    {
      id: 25,
      description: "Global wildcard matching: '*' grants any permission code with ALL scope",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "random.custom.action",
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(new Map([["*", "ALL"]]));
      },
      expected: { allowed: true, scope: "ALL" },
    },

    // 6. Contextual Scope Checks against Resource Objects
    {
      id: 26,
      description: "Resource check INSTITUTE: match when resource belongs to current institute",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      resource: { id: "c-1", instituteId: "inst-100" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["academic.course.read", "INSTITUTE"]]),
        );
      },
      expected: { allowed: true, scope: "INSTITUTE" },
    },
    {
      id: 27,
      description: "Resource check INSTITUTE: reject when resource belongs to another institute",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "academic.course.read",
      resource: { id: "c-1", instituteId: "inst-999" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["academic.course.read", "INSTITUTE"]]),
        );
      },
      expected: { allowed: false, scope: "INSTITUTE", reason: "OUTSIDE_INSTITUTE_SCOPE" },
    },
    {
      id: 28,
      description: "Resource check OWN: allow when resource.userId matches ctx.userId",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "lms.lessonNote.update",
      resource: { id: "note-1", userId: "user-1", instituteId: "inst-100" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.lessonNote.update", "OWN"]]),
        );
      },
      expected: { allowed: true, scope: "OWN" },
    },
    {
      id: 29,
      description: "Resource check OWN: allow when resource.createdById matches ctx.userId",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "lms.lessonNote.update",
      resource: { id: "note-1", createdById: "user-1", instituteId: "inst-100" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.lessonNote.update", "OWN"]]),
        );
      },
      expected: { allowed: true, scope: "OWN" },
    },
    {
      id: 30,
      description: "Resource check OWN: allow when nested resource.student.userId matches ctx.userId",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "assessment.result.read",
      resource: { id: "res-1", student: { userId: "user-1" }, instituteId: "inst-100" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["assessment.result.read", "OWN"]]),
        );
      },
      expected: { allowed: true, scope: "OWN" },
    },
    {
      id: 31,
      description: "Resource check OWN: reject when user is not the owner of the resource",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "lms.lessonNote.update",
      resource: { id: "note-1", userId: "other-user", createdById: "other-user", instituteId: "inst-100" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.lessonNote.update", "OWN"]]),
        );
      },
      expected: { allowed: false, scope: "OWN", reason: "OUTSIDE_OWN_SCOPE" },
    },
    {
      id: 32,
      description: "Resource check OWN: reject if resource belongs to different institute even if owned",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "lms.lessonNote.update",
      resource: { id: "note-1", userId: "user-1", instituteId: "inst-999" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.lessonNote.update", "OWN"]]),
        );
      },
      expected: { allowed: false, scope: "OWN", reason: "OUTSIDE_INSTITUTE_SCOPE" },
    },
    {
      id: 33,
      description: "Resource check ASSIGNED: allow when resource ID is in user's assigned scope",
      ctx: { userId: "teacher-1", instituteId: "inst-100" },
      code: "lms.course.update",
      resource: { id: "course-123", instituteId: "inst-100" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.course.update", "ASSIGNED"]]),
        );
        (resolveAssignedScope as any).mockResolvedValue(["course-123", "course-456"]);
      },
      expected: { allowed: true, scope: "ASSIGNED" },
    },
    {
      id: 34,
      description: "Resource check ASSIGNED: reject when resource ID is NOT in user's assigned scope",
      ctx: { userId: "teacher-1", instituteId: "inst-100" },
      code: "lms.course.update",
      resource: { id: "course-999", instituteId: "inst-100" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.course.update", "ASSIGNED"]]),
        );
        (resolveAssignedScope as any).mockResolvedValue(["course-123"]);
      },
      expected: { allowed: false, scope: "ASSIGNED", reason: "OUTSIDE_ASSIGNED_SCOPE" },
    },
    {
      id: 35,
      description: "Resource check ASSIGNED: reject when resource belongs to another institute",
      ctx: { userId: "teacher-1", instituteId: "inst-100" },
      code: "lms.course.update",
      resource: { id: "course-123", instituteId: "inst-999" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["lms.course.update", "ASSIGNED"]]),
        );
      },
      expected: { allowed: false, scope: "ASSIGNED", reason: "OUTSIDE_INSTITUTE_SCOPE" },
    },
    {
      id: 36,
      description: "Resource check ALL: allow access across any institute with ALL scope",
      ctx: { userId: "user-1", instituteId: "inst-100" },
      code: "platform.user.read",
      resource: { id: "usr-any", instituteId: "inst-999" },
      setup: () => {
        (prisma as any).user.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userRole.findFirst.mockResolvedValue(null);
        (prisma as any).instituteMembership.findUnique.mockResolvedValue({ status: "ACTIVE" });
        (prisma as any).institute.findUnique.mockResolvedValue({ status: "ACTIVE", deletedAt: null });
        (prisma as any).userPermissionOverride.findMany.mockResolvedValue([]);
        (getEffectivePermissions as any).mockResolvedValue(
          new Map([["platform.user.read", "ALL"]]),
        );
      },
      expected: { allowed: true, scope: "ALL" },
    },
  ];

  test.each(testCases)(
    "Case #$id: $description",
    async ({ ctx, code, resource, setup, expected }: ITestCase) => {
      setup();
      const result = await can(ctx, code, resource);

      expect(result.allowed).toBe(expected.allowed);
      if (expected.scope !== undefined) {
        expect(result.scope).toBe(expected.scope);
      }
      if (expected.reason !== undefined) {
        expect(result.reason).toBe(expected.reason);
      }

      // Verify audit logging on platform admin bypass
      if (expected.reason === "PLATFORM_ADMIN_BYPASS") {
        expect(logAudit).toHaveBeenCalledWith(
          expect.objectContaining({
            action: "PLATFORM_ADMIN_BYPASS",
            entityType: "Permission",
            entityId: code,
          }),
        );
      }
    },
  );
});
