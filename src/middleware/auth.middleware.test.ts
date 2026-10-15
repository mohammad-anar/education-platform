import { describe, it, expect, beforeEach, vi } from "vitest";
import { StatusCodes } from "http-status-codes";
import { authenticate, resolveTenant, requirePermission, requireAnyPermission } from "./auth.middleware.js";
import prisma from "../config/prisma.js";
import cacheHelper from "../utils/cache.js";
import { jwtHelper } from "../utils/jwt.js";
import * as evaluator from "../modules/identity/permission-engine/permission-evaluator.js";

vi.mock("../config/prisma.js", () => ({
  default: {
    userRole: {
      findFirst: vi.fn(),
    },
    institute: {
      findUnique: vi.fn(),
    },
    instituteMembership: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("../utils/cache.js", () => ({
  default: {
    isTokenBlacklisted: vi.fn(),
  },
}));

vi.mock("../utils/jwt.js", () => ({
  jwtHelper: {
    verifyToken: vi.fn(),
  },
}));

describe("Route Protection Middlewares (Step 3)", () => {
  let mockReq: any;
  let mockRes: any;
  let nextFn: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      headers: {},
      method: "GET",
      ip: "127.0.0.1",
      socket: { remoteAddress: "127.0.0.1" },
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      headersSent: false,
    };

    nextFn = vi.fn();
  });

  describe("1. authenticate()", () => {
    it("fails with 401 when Authorization header is missing", async () => {
      await authenticate(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: StatusCodes.UNAUTHORIZED }),
      );
    });

    it("fails with 400 when Authorization header does not start with Bearer", async () => {
      mockReq.headers.authorization = "Basic 123456";
      await authenticate(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: StatusCodes.BAD_REQUEST }),
      );
    });

    it("fails with 401 when token is blacklisted in Redis", async () => {
      mockReq.headers.authorization = "Bearer revoked-token-123";
      (cacheHelper.isTokenBlacklisted as any).mockResolvedValue(true);

      await authenticate(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: StatusCodes.UNAUTHORIZED,
          message: "Token has been revoked. Please log in again.",
        }),
      );
    });

    it("attaches req.user and proceeds when token is valid", async () => {
      mockReq.headers.authorization = "Bearer valid-token-123";
      (cacheHelper.isTokenBlacklisted as any).mockResolvedValue(false);
      (jwtHelper.verifyToken as any).mockReturnValue({
        userId: "user-100",
        email: "user@example.com",
      });

      await authenticate(mockReq, mockRes, nextFn);
      expect(mockReq.user).toEqual({ userId: "user-100", email: "user@example.com" });
      expect(nextFn).toHaveBeenCalledWith();
    });
  });

  describe("2. resolveTenant()", () => {
    beforeEach(() => {
      mockReq.user = { userId: "user-100" };
    });

    it("allows platform super admin bypass without institute membership", async () => {
      (prisma as any).userRole.findFirst.mockResolvedValue({
        id: "ur-admin",
        role: { instituteId: null, isSystem: true },
      });

      await resolveTenant(mockReq, mockRes, nextFn);

      expect(mockReq.ctx).toBeDefined();
      expect(mockReq.ctx.isPlatformAdmin).toBe(true);
      expect(mockReq.ctx.userId).toBe("user-100");
      expect(nextFn).toHaveBeenCalled();
    });

    it("returns 404 if platform admin specifies a deleted/invalid target institute", async () => {
      mockReq.headers["x-institute-id"] = "inst-non-existent";
      (prisma as any).userRole.findFirst.mockResolvedValue({
        id: "ur-admin",
        role: { instituteId: null, isSystem: true },
      });
      (prisma as any).institute.findUnique.mockResolvedValue(null);

      await resolveTenant(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: StatusCodes.NOT_FOUND }),
      );
    });

    it("returns 403 when tenant instituteId header/token is missing for regular users", async () => {
      (prisma as any).userRole.findFirst.mockResolvedValue(null);

      await resolveTenant(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "TENANT_REQUIRED" }),
      );
    });

    it("returns 404 when target institute does not exist or is deleted (cross-tenant id)", async () => {
      mockReq.headers["x-institute-id"] = "inst-cross-tenant";
      (prisma as any).userRole.findFirst.mockResolvedValue(null);
      (prisma as any).institute.findUnique.mockResolvedValue(null);

      await resolveTenant(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Institute not found" }),
      );
    });

    it("returns 403 when institute is SUSPENDED", async () => {
      mockReq.headers["x-institute-id"] = "inst-suspended";
      (prisma as any).userRole.findFirst.mockResolvedValue(null);
      (prisma as any).institute.findUnique.mockResolvedValue({
        id: "inst-suspended",
        status: "SUSPENDED",
        deletedAt: null,
      });

      await resolveTenant(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "INSTITUTE_SUSPENDED" }),
      );
    });

    it("returns 403 when user is not an ACTIVE member of the institute", async () => {
      mockReq.headers["x-institute-id"] = "inst-active";
      (prisma as any).userRole.findFirst.mockResolvedValue(null);
      (prisma as any).institute.findUnique.mockResolvedValue({
        id: "inst-active",
        status: "ACTIVE",
        deletedAt: null,
      });
      (prisma as any).instituteMembership.findUnique.mockResolvedValue(null);

      await resolveTenant(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "MEMBERSHIP_INACTIVE" }),
      );
    });

    it("returns 403 when institute subscription is SUSPENDED", async () => {
      mockReq.headers["x-institute-id"] = "inst-active";
      (prisma as any).userRole.findFirst.mockResolvedValue(null);
      (prisma as any).institute.findUnique.mockResolvedValue({
        id: "inst-active",
        status: "ACTIVE",
        deletedAt: null,
      });
      (prisma as any).instituteMembership.findUnique.mockResolvedValue({
        status: "ACTIVE",
      });
      (prisma as any).subscription.findUnique.mockResolvedValue({
        status: "SUSPENDED",
      });

      await resolveTenant(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "SUBSCRIPTION_SUSPENDED" }),
      );
    });

    it("allows GET read-only requests when subscription is EXPIRED", async () => {
      mockReq.method = "GET";
      mockReq.headers["x-institute-id"] = "inst-active";
      (prisma as any).userRole.findFirst.mockResolvedValue(null);
      (prisma as any).institute.findUnique.mockResolvedValue({
        id: "inst-active",
        status: "ACTIVE",
        deletedAt: null,
      });
      (prisma as any).instituteMembership.findUnique.mockResolvedValue({
        status: "ACTIVE",
      });
      (prisma as any).subscription.findUnique.mockResolvedValue({
        status: "EXPIRED",
      });

      await resolveTenant(mockReq, mockRes, nextFn);
      expect(nextFn).toHaveBeenCalled();
      expect(mockReq.ctx.instituteId).toBe("inst-active");
    });

    it("returns 403 for POST mutations when subscription is EXPIRED", async () => {
      mockReq.method = "POST";
      mockReq.headers["x-institute-id"] = "inst-active";
      (prisma as any).userRole.findFirst.mockResolvedValue(null);
      (prisma as any).institute.findUnique.mockResolvedValue({
        id: "inst-active",
        status: "ACTIVE",
        deletedAt: null,
      });
      (prisma as any).instituteMembership.findUnique.mockResolvedValue({
        status: "ACTIVE",
      });
      (prisma as any).subscription.findUnique.mockResolvedValue({
        status: "EXPIRED",
      });

      await resolveTenant(mockReq, mockRes, nextFn);
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ code: "SUBSCRIPTION_EXPIRED" }),
      );
    });
  });

  describe("3. requirePermission() & Acceptance Criteria", () => {
    beforeEach(() => {
      mockReq.user = { userId: "student-1" };
      mockReq.ctx = {
        userId: "student-1",
        instituteId: "inst-active",
        isPlatformAdmin: false,
      };
    });

    it("Acceptance: Student token gets 403 on teacher routes (e.g. assessment.exam.create)", async () => {
      vi.spyOn(evaluator, "can").mockResolvedValue({
        allowed: false,
        reason: "PERMISSION_NOT_GRANTED",
      });

      const guard = requirePermission("assessment.exam.create");
      await guard(mockReq, mockRes, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FORBIDDEN",
          permission: "assessment.exam.create",
          error: expect.objectContaining({
            code: "FORBIDDEN",
            permission: "assessment.exam.create",
          }),
        }),
      );
      expect(nextFn).not.toHaveBeenCalled();
    });

    it("Acceptance: Teacher token with permission is granted access and attaches req.ctx.scope", async () => {
      mockReq.user = { userId: "teacher-1" };
      mockReq.ctx.userId = "teacher-1";

      vi.spyOn(evaluator, "can").mockResolvedValue({
        allowed: true,
        scope: "ASSIGNED",
      });

      const guard = requirePermission("lms.course.update");
      await guard(mockReq, mockRes, nextFn);

      expect(mockReq.ctx.scope).toBe("ASSIGNED");
      expect(nextFn).toHaveBeenCalled();
    });

    it("rejects cross-tenant resource access with 403 OUTSIDE_INSTITUTE_SCOPE", async () => {
      vi.spyOn(evaluator, "can").mockResolvedValue({
        allowed: false,
        scope: "INSTITUTE",
        reason: "OUTSIDE_INSTITUTE_SCOPE",
      });

      const guard = requirePermission("academic.course.read", {
        getResource: () => ({ id: "course-foreign", instituteId: "inst-other" }),
      });

      await guard(mockReq, mockRes, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FORBIDDEN",
          reason: "OUTSIDE_INSTITUTE_SCOPE",
        }),
      );
    });
  });

  describe("4. requireAnyPermission()", () => {
    beforeEach(() => {
      mockReq.user = { userId: "user-100" };
      mockReq.ctx = {
        userId: "user-100",
        instituteId: "inst-active",
        isPlatformAdmin: false,
      };
    });

    it("allows access if at least one permission in the array matches", async () => {
      vi.spyOn(evaluator, "can").mockImplementation(async (ctx, code) => {
        if (code === "academic.course.read") {
          return { allowed: true, scope: "INSTITUTE" };
        }
        return { allowed: false, reason: "PERMISSION_NOT_GRANTED" };
      });

      const guard = requireAnyPermission(["lms.course.update", "academic.course.read"]);
      await guard(mockReq, mockRes, nextFn);

      expect(mockReq.ctx.scope).toBe("INSTITUTE");
      expect(nextFn).toHaveBeenCalled();
    });

    it("returns 403 when none of the permissions match", async () => {
      vi.spyOn(evaluator, "can").mockResolvedValue({
        allowed: false,
        reason: "PERMISSION_NOT_GRANTED",
      });

      const guard = requireAnyPermission(["lms.course.delete", "saas.institute.delete"]);
      await guard(mockReq, mockRes, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "FORBIDDEN",
          permissions: ["lms.course.delete", "saas.institute.delete"],
        }),
      );
    });
  });
});
