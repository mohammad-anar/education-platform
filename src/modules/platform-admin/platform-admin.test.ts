import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "../../config/prisma.js";
import cacheHelper from "../../utils/cache.js";
import { logAudit } from "../../utils/audit.js";
import {
  enforcePlanLimit,
  listTenants,
  getTenantDetail,
  suspendTenant,
  activateTenant,
  changeTenantPlan,
  getPlatformKpis,
  getRevenueTrend,
  getUsageVsLimit,
  getFailedPayments,
  getUpcomingRenewals,
  getTopActiveTenants,
  impersonateStart,
  impersonateEnd,
  getAuditLogs,
} from "./platform-admin.service.js";
import { requirePlatformAdmin } from "./platform-admin.route.js";
import ApiError from "../../utils/ApiError.js";

vi.mock("../../config/prisma.js", () => ({
  default: {
    institute: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    subscription: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    subscriptionPlan: {
      findUnique: vi.fn(),
    },
    subscriptionPayment: {
      findMany: vi.fn(),
    },
    student: {
      count: vi.fn(),
    },
    teacherProfile: {
      count: vi.fn(),
    },
    course: {
      count: vi.fn(),
    },
    fileAsset: {
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

vi.mock("../../utils/cache.js", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    delByPattern: vi.fn(),
    blacklistToken: vi.fn(),
  },
}));

vi.mock("../../utils/audit.js", () => ({
  logAudit: vi.fn(),
  maskSensitiveData: vi.fn((data) => data),
}));

describe("Step 11 - Platform Owner Console", () => {
  const platformAdminCtx = {
    userId: "admin-root-user",
    instituteId: null,
    isPlatformAdmin: true,
  };

  const regularUserCtx = {
    userId: "regular-user",
    instituteId: "tenant-1",
    isPlatformAdmin: false,
  };

  const tenantId = "11111111-1111-1111-1111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // SECTION 1: ACCESS CONTROL & ACCEPTANCE
  // ==========================================
  describe("Access Control & Acceptance Gate", () => {
    it("1. Acceptance: non-platform user gets 403 on every route", () => {
      const mockReq = { ctx: regularUserCtx } as any;
      const mockRes = {} as any;
      const mockNext = vi.fn();

      expect(() => requirePlatformAdmin(mockReq, mockRes, mockNext)).toThrowError(ApiError);
      try {
        requirePlatformAdmin(mockReq, mockRes, mockNext);
      } catch (err: any) {
        expect(err.statusCode).toBe(403);
        expect(err.message).toContain("Platform Administrator privilege required");
      }
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("2. Platform super admin passes requirePlatformAdmin gate", () => {
      const mockReq = { ctx: platformAdminCtx } as any;
      const mockRes = {} as any;
      const mockNext = vi.fn();

      requirePlatformAdmin(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 2: TENANT OPERATIONS & PII AUDIT
  // ==========================================
  describe("Tenant Lifecycle & PII Audit Logging", () => {
    it("3. listTenants filters by status, search, and returns counts", async () => {
      (prisma.institute.findMany as any).mockResolvedValue([
        {
          id: tenantId,
          name: "Dhaka International Academy",
          code: "DIA-01",
          status: "ACTIVE",
          subscription: {
            id: "sub-1",
            status: "ACTIVE",
            billingCycle: "YEARLY",
            plan: { name: "Enterprise Plan", code: "ENTERPRISE" },
          },
          _count: { students: 120, teachers: 15, courses: 25 },
        },
      ]);
      (prisma.institute.count as any).mockResolvedValue(1);

      const result = await listTenants({ search: "Dhaka", status: "ACTIVE" }, platformAdminCtx);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Dhaka International Academy");
      expect(result.data[0].stats.studentsCount).toBe(120);
      expect(result.meta.total).toBe(1);
    });

    it("4. getTenantDetail writes PLATFORM_ADMIN_PII_ACCESS audit log entry", async () => {
      (prisma.institute.findUnique as any).mockResolvedValue({
        id: tenantId,
        name: "Sylhet Model College",
        email: "principal@sylhet.edu",
        status: "ACTIVE",
        subscription: {
          plan: { name: "Pro Plan" },
          payments: [],
        },
        _count: { students: 50, teachers: 10, staff: 5, courses: 12, files: 100 },
      });

      const result = await getTenantDetail(tenantId, platformAdminCtx);

      expect(result.name).toBe("Sylhet Model College");
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "PLATFORM_ADMIN_PII_ACCESS",
          entityType: "Institute",
          entityId: tenantId,
        }),
      );
    });

    it("5. suspendTenant updates status to INACTIVE, subscription to SUSPENDED, and logs TENANT_SUSPEND", async () => {
      (prisma.institute.findUnique as any).mockResolvedValue({
        id: tenantId,
        status: "ACTIVE",
      });
      (prisma.institute.update as any).mockResolvedValue({
        id: tenantId,
        status: "INACTIVE",
      });
      (prisma.subscription.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await suspendTenant(
        tenantId,
        "Non-payment of subscription fee",
        platformAdminCtx,
      );

      expect(result.institute.status).toBe("INACTIVE");
      expect(result.suspensionReason).toBe("Non-payment of subscription fee");
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "TENANT_SUSPEND",
          entityType: "Institute",
          entityId: tenantId,
        }),
      );
    });

    it("6. activateTenant reactivates institute and subscription, logging TENANT_ACTIVATE", async () => {
      (prisma.institute.findUnique as any).mockResolvedValue({
        id: tenantId,
        status: "INACTIVE",
      });
      (prisma.institute.update as any).mockResolvedValue({
        id: tenantId,
        status: "ACTIVE",
      });
      (prisma.subscription.updateMany as any).mockResolvedValue({ count: 1 });

      const result = await activateTenant(tenantId, platformAdminCtx);

      expect(result.status).toBe("ACTIVE");
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "TENANT_ACTIVATE",
          entityType: "Institute",
          entityId: tenantId,
        }),
      );
    });

    it("7. changeTenantPlan updates planId, billing cycle, and logs TENANT_PLAN_CHANGE", async () => {
      const newPlanId = "plan-enterprise-uuid";
      (prisma.subscriptionPlan.findUnique as any).mockResolvedValue({
        id: newPlanId,
        name: "Enterprise Tier",
        status: "ACTIVE",
      });
      (prisma.subscription.findFirst as any).mockResolvedValue({
        id: "sub-current",
        planId: "plan-old",
        billingCycle: "MONTHLY",
      });
      (prisma.subscription.update as any).mockResolvedValue({
        id: "sub-current",
        planId: newPlanId,
        billingCycle: "YEARLY",
        status: "ACTIVE",
      });

      const result = await changeTenantPlan(tenantId, newPlanId, "YEARLY", platformAdminCtx);

      expect(result.planId).toBe(newPlanId);
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "TENANT_PLAN_CHANGE",
          entityType: "Subscription",
        }),
      );
    });
  });

  // ==========================================
  // SECTION 3: BUSINESS KPIS, REVENUE & USAGE
  // ==========================================
  describe("Financial Analytics & Quota Usage", () => {
    it("8. getPlatformKpis computes MRR, ARR, churn rate, and trial conversion", async () => {
      (prisma.institute.count as any)
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(80) // active
        .mockResolvedValueOnce(5); // suspended
      (prisma.subscription.count as any)
        .mockResolvedValueOnce(15) // trial
        .mockResolvedValueOnce(10) // cancelled/expired
        .mockResolvedValueOnce(120) // trial total
        .mockResolvedValueOnce(70); // active paid

      (prisma.subscription.findMany as any).mockResolvedValue([
        {
          status: "ACTIVE",
          billingCycle: "MONTHLY",
          plan: { monthlyPrice: 5000 },
        },
        {
          status: "ACTIVE",
          billingCycle: "YEARLY",
          plan: { yearlyPrice: 120000 }, // 10000/mo
        },
      ]);

      const result = await getPlatformKpis();

      expect(result.totalTenants).toBe(100);
      expect(result.mrr).toBe(15000); // 5000 + 120000/12
      expect(result.arr).toBe(180000); // 15000 * 12
      expect(result.churnRate).toBeGreaterThan(0);
      expect(result.trialConversionRate).toBeGreaterThan(0);
      expect(result.kpis).toHaveLength(5);
    });

    it("9. getRevenueTrend aggregates 12 months of successful payments", async () => {
      (prisma.subscriptionPayment.findMany as any).mockResolvedValue([
        { amount: 50000, paidAt: new Date() },
        { amount: 25000, paidAt: new Date() },
      ]);

      const result = await getRevenueTrend();

      expect(result.chart).toBeDefined();
      expect(result.chart.length).toBe(12);
      expect(result.kpis[0].value).toBe(75000);
    });

    it("10. getUsageVsLimit compares resource counts vs plan limits", async () => {
      (prisma.institute.findUnique as any).mockResolvedValue({
        id: tenantId,
        name: "Pioneer School",
        subscription: {
          plan: {
            name: "Basic Plan",
            code: "BASIC",
            maxStudents: 100,
            maxTeachers: 10,
            maxCourses: 5,
            maxStorageMb: BigInt(1024), // 1GB
          },
        },
      });

      (prisma.student.count as any).mockResolvedValue(95);
      (prisma.teacherProfile.count as any).mockResolvedValue(8);
      (prisma.course.count as any).mockResolvedValue(5); // reached limit
      (prisma.fileAsset.findMany as any).mockResolvedValue([{ size: 524288000 }]); // 500MB

      const result = await getUsageVsLimit(tenantId);

      expect(result.resources.students.current).toBe(95);
      expect(result.resources.students.percentUsed).toBe(95);
      expect(result.resources.courses.exceeded).toBe(true);
      expect(result.resources.teachers.exceeded).toBe(false);
    });

    it("11. getFailedPayments retrieves failed payment transactions", async () => {
      (prisma.subscriptionPayment.findMany as any).mockResolvedValue([
        {
          id: "pay-failed-1",
          amount: 15000,
          currency: "BDT",
          method: "CARD",
          createdAt: new Date(),
          subscription: {
            institute: { name: "Barisal High" },
            plan: { name: "Pro" },
          },
        },
      ]);

      const result = await getFailedPayments();

      expect(result).toHaveLength(1);
      expect(result[0].amount).toBe(15000);
      expect(result[0].tenant.name).toBe("Barisal High");
    });

    it("12. getUpcomingRenewals finds subscriptions expiring in next N days", async () => {
      const expiringDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days from now
      (prisma.subscription.findMany as any).mockResolvedValue([
        {
          id: "sub-renew",
          expiresAt: expiringDate,
          billingCycle: "YEARLY",
          autoRenew: true,
          institute: { name: "Rajshahi Academy" },
          plan: { name: "Enterprise" },
        },
      ]);

      const result = await getUpcomingRenewals(30);

      expect(result).toHaveLength(1);
      expect(result[0].tenant.name).toBe("Rajshahi Academy");
      expect(result[0].daysRemaining).toBeLessThanOrEqual(5);
    });

    it("13. getTopActiveTenants scores and ranks active tenants", async () => {
      (prisma.institute.findMany as any).mockResolvedValue([
        {
          id: "inst-1",
          name: "High Activity School",
          code: "HAS-01",
          _count: { students: 500, teachers: 50, courses: 40, attendanceSessions: 300 },
        },
        {
          id: "inst-2",
          name: "Small Academy",
          code: "SA-01",
          _count: { students: 50, teachers: 5, courses: 5, attendanceSessions: 20 },
        },
      ]);

      const result = await getTopActiveTenants(10);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("High Activity School");
      expect(result[0].activityScore).toBeGreaterThan(result[1].activityScore);
    });
  });

  // ==========================================
  // SECTION 4: IMPERSONATION & AUDIT LOGS
  // ==========================================
  describe("Impersonation Engine & Audit Logging", () => {
    it("14. impersonateStart issues short-lived token flagged impersonated and logs audit", async () => {
      const targetUserId = "target-teacher-uuid";
      (prisma.user.findUnique as any).mockResolvedValue({
        id: targetUserId,
        name: "Teacher Alice",
        email: "alice@institute.edu",
        status: "ACTIVE",
      });

      const result = await impersonateStart(
        {
          tenantId,
          userId: targetUserId,
          reason: "Investigating grade discrepancy reported by student",
          ttlSeconds: 900,
        },
        platformAdminCtx,
      );

      expect(result.token).toBeDefined();
      expect(result.targetUserId).toBe(targetUserId);
      expect(result.impersonatedBy).toBe(platformAdminCtx.userId);
      expect(cacheHelper.set).toHaveBeenCalledWith(
        expect.stringContaining("impersonation:"),
        expect.any(Object),
        900,
      );
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "PLATFORM_IMPERSONATION_START",
          entityType: "User",
          entityId: targetUserId,
        }),
      );
    });

    it("15. impersonateEnd blacklists token in Redis and logs audit", async () => {
      const sampleToken = "sample-impersonation-jwt-token";

      const result = await impersonateEnd(sampleToken, platformAdminCtx);

      expect(cacheHelper.blacklistToken).toHaveBeenCalledWith(sampleToken, 7200);
      expect(cacheHelper.del).toHaveBeenCalledWith(`impersonation:${sampleToken}`);
      expect(logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "PLATFORM_IMPERSONATION_END",
        }),
      );
    });

    it("16. getAuditLogs queries platform logs with cursor pagination", async () => {
      (prisma.auditLog.findMany as any).mockResolvedValue([
        {
          id: "log-1",
          action: "TENANT_SUSPEND",
          entityType: "Institute",
          createdAt: new Date(),
          user: { name: "Platform Admin" },
        },
      ]);

      const result = await getAuditLogs({ action: "TENANT_SUSPEND" });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].action).toBe("TENANT_SUSPEND");
    });
  });

  // ==========================================
  // SECTION 5: PLAN LIMIT ENFORCEMENT HELPER
  // ==========================================
  describe("enforcePlanLimit Reusable Helper", () => {
    beforeEach(() => {
      (prisma.subscription.findFirst as any).mockResolvedValue({
        id: "sub-1",
        status: "ACTIVE",
        plan: {
          id: "plan-basic",
          maxStudents: 50,
          maxTeachers: 5,
          maxCourses: 3,
          maxStorageMb: BigInt(100),
        },
      });
    });

    it("17. enforcePlanLimit throws 403 when student limit is reached", async () => {
      (prisma.student.count as any).mockResolvedValue(50); // limit reached

      await expect(enforcePlanLimit(tenantId, "student")).rejects.toThrow(
        /Subscription plan limit reached: Current plan allows a maximum of 50 active students/,
      );
    });

    it("18. enforcePlanLimit throws 403 when teacher limit is reached", async () => {
      (prisma.teacherProfile.count as any).mockResolvedValue(5); // limit reached

      await expect(enforcePlanLimit(tenantId, "teacher")).rejects.toThrow(
        /Subscription plan limit reached: Current plan allows a maximum of 5 active teachers/,
      );
    });

    it("19. enforcePlanLimit throws 403 when course limit is reached", async () => {
      (prisma.course.count as any).mockResolvedValue(3); // limit reached

      await expect(enforcePlanLimit(tenantId, "course")).rejects.toThrow(
        /Subscription plan limit reached: Current plan allows a maximum of 3 courses/,
      );
    });

    it("20. enforcePlanLimit throws 403 when file upload exceeds storage limit", async () => {
      // 95MB existing + 10MB new = 105MB (> 100MB)
      (prisma.fileAsset.findMany as any).mockResolvedValue([
        { size: 95 * 1024 * 1024 },
      ]);

      await expect(
        enforcePlanLimit(tenantId, "file", 10 * 1024 * 1024),
      ).rejects.toThrow(/Storage limit exceeded: Current plan allows up to 100MB/);
    });

    it("21. enforcePlanLimit passes when counts are under plan limit", async () => {
      (prisma.student.count as any).mockResolvedValue(20);

      await expect(enforcePlanLimit(tenantId, "student")).resolves.toBeUndefined();
    });
  });
});
