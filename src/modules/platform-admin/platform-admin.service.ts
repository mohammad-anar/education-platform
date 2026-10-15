import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import env from "../../config/env.js";
import { jwtHelper } from "../../utils/jwt.js";
import cacheHelper from "../../utils/cache.js";
import { logAudit } from "../../utils/audit.js";
import { Secret } from "jsonwebtoken";
import {
  IAuditLogFilterQuery,
  IImpersonatePayload,
  IImpersonateResult,
  IPlatformKpis,
  ITenantFilterQuery,
  IUsageVsLimit,
} from "./platform-admin.interface.js";
import { IChartDataPoint, IKPICard } from "../dashboard/dashboard.interface.js";

/**
 * Enforces SaaS subscription limits for a tenant before resource creation.
 * Checks student, teacher, course, and file storage caps against active subscription plan.
 *
 * @param {string} instituteId - Target tenant ID
 * @param {"student" | "teacher" | "course" | "file"} resource - Type of resource
 * @param {number} [addAmount] - Additional bytes (for file storage checks)
 */
export const enforcePlanLimit = async (
  instituteId: string,
  resource: "student" | "teacher" | "course" | "file",
  addAmount?: number,
): Promise<void> => {
  const subscription = await (prisma as any).subscription.findFirst({
    where: {
      instituteId,
      status: { in: ["ACTIVE", "TRIAL"] },
    },
    include: { plan: true },
  });

  if (!subscription || !subscription.plan) {
    return;
  }

  const { plan } = subscription;

  if (resource === "student" && plan.maxStudents !== null && plan.maxStudents !== undefined) {
    const currentStudents = await (prisma as any).student.count({
      where: { instituteId, status: "ACTIVE" },
    });
    if (currentStudents >= plan.maxStudents) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Subscription plan limit reached: Current plan allows a maximum of ${plan.maxStudents} active students. Please upgrade your plan.`,
      );
    }
  }

  if (resource === "teacher" && plan.maxTeachers !== null && plan.maxTeachers !== undefined) {
    const currentTeachers = await (prisma as any).teacherProfile.count({
      where: { instituteId, employmentStatus: "ACTIVE" },
    });
    if (currentTeachers >= plan.maxTeachers) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Subscription plan limit reached: Current plan allows a maximum of ${plan.maxTeachers} active teachers. Please upgrade your plan.`,
      );
    }
  }

  if (resource === "course" && plan.maxCourses !== null && plan.maxCourses !== undefined) {
    const currentCourses = await (prisma as any).course.count({
      where: { instituteId },
    });
    if (currentCourses >= plan.maxCourses) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Subscription plan limit reached: Current plan allows a maximum of ${plan.maxCourses} courses. Please upgrade your plan.`,
      );
    }
  }

  if (resource === "file" && plan.maxStorageMb !== null && plan.maxStorageMb !== undefined) {
    const fileAssets = await (prisma as any).fileAsset.findMany({
      where: { instituteId },
      select: { size: true },
    });
    let currentBytes = 0;
    for (const f of fileAssets) {
      currentBytes += f.size ? Number(f.size) : 0;
    }
    const additionalBytes = addAmount || 0;
    const currentMb = (currentBytes + additionalBytes) / (1024 * 1024);
    const limitMb = Number(plan.maxStorageMb);

    if (currentMb > limitMb) {
      throw new ApiError(
        StatusCodes.FORBIDDEN,
        `Storage limit exceeded: Current plan allows up to ${limitMb}MB storage. Total would be ${currentMb.toFixed(2)}MB. Please upgrade your plan.`,
      );
    }
  }
};

/**
 * 1. listTenants
 * Returns paginated list of tenant institutes with subscription, active plan, and counts.
 */
export const listTenants = async (filters: ITenantFilterQuery, ctx: any) => {
  const { status, planCode, subscriptionStatus, search, page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const whereConditions: any = {
    deletedAt: null,
    ...(status ? { status } : {}),
    ...(subscriptionStatus
      ? { subscription: { status: subscriptionStatus } }
      : {}),
    ...(planCode
      ? { subscription: { plan: { code: planCode } } }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [tenants, total] = await Promise.all([
    (prisma as any).institute.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: {
            plan: { select: { id: true, name: true, code: true, monthlyPrice: true } },
          },
        },
        _count: {
          select: {
            students: true,
            teachers: true,
            courses: true,
          },
        },
      },
    }),
    (prisma as any).institute.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: tenants.map((t: any) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      slug: t.slug,
      status: t.status,
      email: t.email,
      phone: t.phone,
      subscription: t.subscription
        ? {
            id: t.subscription.id,
            status: t.subscription.status,
            planName: t.subscription.plan.name,
            planCode: t.subscription.plan.code,
            billingCycle: t.subscription.billingCycle,
            expiresAt: t.subscription.expiresAt,
          }
        : null,
      stats: {
        studentsCount: t._count.students,
        teachersCount: t._count.teachers,
        coursesCount: t._count.courses,
      },
      createdAt: t.createdAt,
    })),
  };
};

/**
 * 2. getTenantDetail
 * Returns full tenant details, plan limits, usage, and logs PLATFORM_ADMIN_PII_ACCESS audit entry.
 */
export const getTenantDetail = async (tenantId: string, ctx: any) => {
  const tenant = await (prisma as any).institute.findUnique({
    where: { id: tenantId },
    include: {
      settings: true,
      subscription: {
        include: {
          plan: true,
          payments: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
        },
      },
      _count: {
        select: {
          students: true,
          teachers: true,
          staff: true,
          courses: true,
          files: true,
        },
      },
    },
  });

  if (!tenant || tenant.deletedAt) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant institute not found.");
  }

  // Audit log for PII Access by platform admin
  await logAudit({
    ctx,
    action: "PLATFORM_ADMIN_PII_ACCESS",
    entityType: "Institute",
    entityId: tenantId,
    newValue: {
      tenantName: tenant.name,
      tenantEmail: tenant.email,
      accessedAt: new Date().toISOString(),
    },
  });

  return tenant;
};

/**
 * 3. suspendTenant
 * Suspends tenant institute and its subscription with audit logging.
 */
export const suspendTenant = async (tenantId: string, reason: string, ctx: any) => {
  const oldInstitute = await (prisma as any).institute.findUnique({
    where: { id: tenantId },
  });
  if (!oldInstitute) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant institute not found.");
  }

  const [updatedInstitute, updatedSubscription] = await (prisma as any).$transaction([
    (prisma as any).institute.update({
      where: { id: tenantId },
      data: { status: "INACTIVE" },
    }),
    (prisma as any).subscription.updateMany({
      where: { instituteId: tenantId },
      data: {
        status: "SUSPENDED",
        cancelledAt: new Date(),
        canceledReason: reason,
      },
    }),
  ]);

  // Log sensitive mutation in audit log
  await logAudit({
    ctx,
    action: "TENANT_SUSPEND",
    entityType: "Institute",
    entityId: tenantId,
    oldValue: { status: oldInstitute.status },
    newValue: { status: "INACTIVE", reason },
  });

  // Invalidate caches
  await cacheHelper.delByPattern(`dash:admin:${tenantId}:*`);

  return {
    institute: updatedInstitute,
    suspensionReason: reason,
  };
};

/**
 * 4. activateTenant
 * Reactivates a suspended tenant institute and active subscription.
 */
export const activateTenant = async (tenantId: string, ctx: any) => {
  const oldInstitute = await (prisma as any).institute.findUnique({
    where: { id: tenantId },
  });
  if (!oldInstitute) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant institute not found.");
  }

  const [updatedInstitute] = await (prisma as any).$transaction([
    (prisma as any).institute.update({
      where: { id: tenantId },
      data: { status: "ACTIVE" },
    }),
    (prisma as any).subscription.updateMany({
      where: { instituteId: tenantId },
      data: {
        status: "ACTIVE",
        cancelledAt: null,
        canceledReason: null,
      },
    }),
  ]);

  await logAudit({
    ctx,
    action: "TENANT_ACTIVATE",
    entityType: "Institute",
    entityId: tenantId,
    oldValue: { status: oldInstitute.status },
    newValue: { status: "ACTIVE" },
  });

  await cacheHelper.delByPattern(`dash:admin:${tenantId}:*`);

  return updatedInstitute;
};

/**
 * 5. changeTenantPlan
 * Modifies the tenant's subscription plan and billing cycle.
 */
export const changeTenantPlan = async (
  tenantId: string,
  planId: string,
  billingCycle: any,
  ctx: any,
) => {
  const targetPlan = await (prisma as any).subscriptionPlan.findUnique({
    where: { id: planId, status: "ACTIVE" },
  });
  if (!targetPlan) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Active subscription plan not found.");
  }

  const currentSubscription = await (prisma as any).subscription.findFirst({
    where: { instituteId: tenantId },
  });
  if (!currentSubscription) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Subscription not found for this tenant.");
  }

  const updatedSubscription = await (prisma as any).subscription.update({
    where: { id: currentSubscription.id },
    data: {
      planId,
      billingCycle,
      status: "ACTIVE",
      updatedAt: new Date(),
    },
    include: { plan: true },
  });

  await logAudit({
    ctx,
    action: "TENANT_PLAN_CHANGE",
    entityType: "Subscription",
    entityId: currentSubscription.id,
    oldValue: {
      planId: currentSubscription.planId,
      billingCycle: currentSubscription.billingCycle,
    },
    newValue: {
      planId,
      planName: targetPlan.name,
      billingCycle,
    },
  });

  return updatedSubscription;
};

/**
 * 6. getPlatformKpis
 * Computes platform-wide business metrics: total tenants, MRR, ARR, churn rate, trial conversion rate.
 */
export const getPlatformKpis = async (): Promise<IPlatformKpis> => {
  const [
    totalTenants,
    activeTenants,
    trialTenants,
    suspendedTenants,
    subscriptions,
    cancelledCount,
    trialCountTotal,
    paidActiveCount,
  ] = await Promise.all([
    (prisma as any).institute.count({ where: { deletedAt: null } }),
    (prisma as any).institute.count({ where: { status: "ACTIVE", deletedAt: null } }),
    (prisma as any).subscription.count({ where: { status: "TRIAL" } }),
    (prisma as any).institute.count({ where: { status: "INACTIVE", deletedAt: null } }),
    (prisma as any).subscription.findMany({
      where: { status: { in: ["ACTIVE", "TRIAL"] } },
      include: { plan: true },
    }),
    (prisma as any).subscription.count({ where: { status: { in: ["CANCELLED", "SUSPENDED", "EXPIRED"] } } }),
    (prisma as any).subscription.count(),
    (prisma as any).subscription.count({ where: { status: "ACTIVE" } }),
  ]);

  // Compute MRR & ARR
  let mrr = 0;
  for (const sub of subscriptions) {
    if (sub.status === "ACTIVE" && sub.plan) {
      if (sub.billingCycle === "YEARLY" && sub.plan.yearlyPrice) {
        mrr += Number(sub.plan.yearlyPrice) / 12;
      } else if (sub.plan.monthlyPrice) {
        mrr += Number(sub.plan.monthlyPrice);
      }
    }
  }
  mrr = Number(mrr.toFixed(2));
  const arr = Number((mrr * 12).toFixed(2));

  // Compute Churn Rate (%)
  const churnRate =
    trialCountTotal > 0 ? Number(((cancelledCount / trialCountTotal) * 100).toFixed(1)) : 0;

  // Compute Trial Conversion Rate (%)
  const trialConversionRate =
    trialCountTotal > 0 ? Number(((paidActiveCount / trialCountTotal) * 100).toFixed(1)) : 0;

  const kpis: IKPICard[] = [
    { title: "Total Tenants", value: totalTenants, unit: "institutes", status: "neutral" },
    { title: "Monthly Recurring Revenue (MRR)", value: mrr, unit: "BDT", status: "positive" },
    { title: "Annual Recurring Revenue (ARR)", value: arr, unit: "BDT", status: "positive" },
    { title: "Churn Rate", value: churnRate, unit: "%", status: churnRate > 10 ? "negative" : "positive" },
    { title: "Trial Conversion Rate", value: trialConversionRate, unit: "%", status: "positive" },
  ];

  const charts = {
    tenantDistribution: [
      { label: "Active", value: activeTenants },
      { label: "Trial", value: trialTenants },
      { label: "Suspended", value: suspendedTenants },
    ],
    subscriptionStatusDistribution: [
      { label: "Active Paid", value: paidActiveCount },
      { label: "In Trial", value: trialTenants },
      { label: "Cancelled / Expired", value: cancelledCount },
    ],
  };

  return {
    totalTenants,
    activeTenants,
    trialTenants,
    suspendedTenants,
    mrr,
    arr,
    churnRate,
    trialConversionRate,
    kpis,
    charts,
  };
};

/**
 * 7. getRevenueTrend
 * 12-month monthly payment collection history from SubscriptionPayment.
 */
export const getRevenueTrend = async (period?: "month" | "year") => {
  const monthsBack = 12;
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

  const payments = await (prisma as any).subscriptionPayment.findMany({
    where: {
      status: "SUCCESS",
      paidAt: { gte: startDate },
    },
    select: { amount: true, paidAt: true },
  });

  const monthMap: Record<string, number> = {};
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = 0;
  }

  let totalRevenue = 0;
  for (const p of payments) {
    const d = new Date(p.paidAt || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const amt = Number(p.amount);
    totalRevenue += amt;
    if (monthMap[key] !== undefined) {
      monthMap[key] += amt;
    }
  }

  const chart: IChartDataPoint[] = Object.keys(monthMap)
    .sort()
    .map((month) => ({
      label: month,
      value: Number(monthMap[month].toFixed(2)),
    }));

  const kpis: IKPICard[] = [
    {
      title: "12-Month Total Revenue",
      value: Number(totalRevenue.toFixed(2)),
      unit: "BDT",
      status: "positive",
    },
  ];

  return { kpis, chart };
};

/**
 * 8. getUsageVsLimit
 * Compares tenant resource consumption against plan quotas.
 */
export const getUsageVsLimit = async (tenantId: string): Promise<IUsageVsLimit> => {
  const tenant = await (prisma as any).institute.findUnique({
    where: { id: tenantId },
    include: {
      subscription: { include: { plan: true } },
    },
  });

  if (!tenant) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Tenant institute not found.");
  }

  const plan = tenant.subscription?.plan;
  const planName = plan?.name || "Standard";
  const planCode = plan?.code || "DEFAULT";

  const [studentCount, teacherCount, courseCount, fileAssets] = await Promise.all([
    (prisma as any).student.count({ where: { instituteId: tenantId, status: "ACTIVE" } }),
    (prisma as any).teacherProfile.count({ where: { instituteId: tenantId, employmentStatus: "ACTIVE" } }),
    (prisma as any).course.count({ where: { instituteId: tenantId } }),
    (prisma as any).fileAsset.findMany({ where: { instituteId: tenantId }, select: { size: true } }),
  ]);

  let totalBytes = 0;
  for (const f of fileAssets) {
    totalBytes += f.size ? Number(f.size) : 0;
  }
  const storageMb = Number((totalBytes / (1024 * 1024)).toFixed(2));

  const maxStudents = plan?.maxStudents ?? null;
  const maxTeachers = plan?.maxTeachers ?? null;
  const maxCourses = plan?.maxCourses ?? null;
  const maxStorageMb = plan?.maxStorageMb ? Number(plan.maxStorageMb) : null;

  return {
    tenantId,
    instituteName: tenant.name,
    planName,
    planCode,
    resources: {
      students: {
        current: studentCount,
        limit: maxStudents,
        percentUsed: maxStudents ? Number(((studentCount / maxStudents) * 100).toFixed(1)) : 0,
        exceeded: maxStudents !== null && studentCount >= maxStudents,
      },
      teachers: {
        current: teacherCount,
        limit: maxTeachers,
        percentUsed: maxTeachers ? Number(((teacherCount / maxTeachers) * 100).toFixed(1)) : 0,
        exceeded: maxTeachers !== null && teacherCount >= maxTeachers,
      },
      courses: {
        current: courseCount,
        limit: maxCourses,
        percentUsed: maxCourses ? Number(((courseCount / maxCourses) * 100).toFixed(1)) : 0,
        exceeded: maxCourses !== null && courseCount >= maxCourses,
      },
      storageMb: {
        current: storageMb,
        limit: maxStorageMb,
        percentUsed: maxStorageMb ? Number(((storageMb / maxStorageMb) * 100).toFixed(1)) : 0,
        exceeded: maxStorageMb !== null && storageMb >= maxStorageMb,
      },
    },
  };
};

/**
 * 9. getFailedPayments
 * Retrieves failed subscription transactions for payment recovery.
 */
export const getFailedPayments = async () => {
  const failedPayments = await (prisma as any).subscriptionPayment.findMany({
    where: { status: "FAILED" },
    include: {
      subscription: {
        include: {
          institute: { select: { id: true, name: true, code: true, email: true, phone: true } },
          plan: { select: { name: true, code: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return failedPayments.map((p: any) => ({
    id: p.id,
    amount: Number(p.amount),
    currency: p.currency,
    method: p.method,
    transactionId: p.transactionId,
    gateway: p.gateway,
    failedAt: p.createdAt,
    tenant: p.subscription?.institute,
    plan: p.subscription?.plan,
  }));
};

/**
 * 10. getUpcomingRenewals
 * Subscriptions expiring in the next N days.
 */
export const getUpcomingRenewals = async (days: number = 30) => {
  const now = new Date();
  const future = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const renewals = await (prisma as any).subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL"] },
      expiresAt: { gte: now, lte: future },
    },
    include: {
      institute: { select: { id: true, name: true, email: true, phone: true } },
      plan: { select: { name: true, monthlyPrice: true, yearlyPrice: true } },
    },
    orderBy: { expiresAt: "asc" },
  });

  return renewals.map((r: any) => {
    const diffMs = new Date(r.expiresAt).getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      subscriptionId: r.id,
      tenant: r.institute,
      plan: r.plan,
      billingCycle: r.billingCycle,
      expiresAt: r.expiresAt,
      daysRemaining,
      autoRenew: r.autoRenew,
    };
  });
};

/**
 * 11. getTopActiveTenants
 * Ranks tenants by active students, courses, and attendance records.
 */
export const getTopActiveTenants = async (limit: number = 10) => {
  const tenants = await (prisma as any).institute.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          courses: true,
          attendanceSessions: true,
        },
      },
    },
    take: 50,
  });

  // Calculate composite engagement score
  const ranked = tenants
    .map((t: any) => {
      const score =
        t._count.students * 2 +
        t._count.teachers * 3 +
        t._count.courses * 5 +
        t._count.attendanceSessions * 1;

      return {
        tenantId: t.id,
        name: t.name,
        code: t.code,
        activityScore: score,
        studentsCount: t._count.students,
        teachersCount: t._count.teachers,
        coursesCount: t._count.courses,
        sessionsCount: t._count.attendanceSessions,
      };
    })
    .sort((a: any, b: any) => b.activityScore - a.activityScore)
    .slice(0, limit);

  return ranked;
};

/**
 * 12. impersonateStart
 * Generates a short-lived impersonation token and records an audit log entry.
 */
export const impersonateStart = async (
  payload: IImpersonatePayload,
  ctx: any,
): Promise<IImpersonateResult> => {
  const { tenantId, userId, reason, ttlSeconds = 1800 } = payload;

  const targetUser = await (prisma as any).user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, status: true },
  });

  if (!targetUser || targetUser.status !== "ACTIVE") {
    throw new ApiError(StatusCodes.NOT_FOUND, "Target active user not found for impersonation.");
  }

  const tokenPayload = {
    userId: targetUser.id,
    instituteId: tenantId,
    impersonated: true,
    impersonatedBy: ctx.userId,
    impersonationReason: reason,
  };

  const token = jwtHelper.createToken(
    tokenPayload,
    env.jwt.jwt_secret as Secret,
    `${ttlSeconds}s`,
  );

  // Store active impersonation session in Redis
  await cacheHelper.set(`impersonation:${token}`, { ...tokenPayload, createdAt: new Date() }, ttlSeconds);

  // Sensitive security audit entry
  await logAudit({
    ctx,
    action: "PLATFORM_IMPERSONATION_START",
    entityType: "User",
    entityId: userId,
    newValue: {
      tenantId,
      targetUserEmail: targetUser.email,
      reason,
      ttlSeconds,
    },
  });

  return {
    token,
    expiresInSeconds: ttlSeconds,
    tenantId,
    targetUserId: targetUser.id,
    targetUserName: targetUser.name,
    targetUserEmail: targetUser.email,
    impersonatedBy: ctx.userId,
    reason,
  };
};

/**
 * 13. impersonateEnd
 * Ends active impersonation session by revoking the token in Redis.
 */
export const impersonateEnd = async (impersonationToken: string, ctx: any) => {
  await cacheHelper.blacklistToken(impersonationToken, 7200);
  await cacheHelper.del(`impersonation:${impersonationToken}`);

  await logAudit({
    ctx,
    action: "PLATFORM_IMPERSONATION_END",
    entityType: "User",
    entityId: ctx.userId,
    newValue: { revokedAt: new Date().toISOString() },
  });

  return { message: "Impersonation session terminated and token revoked." };
};

/**
 * 14. getAuditLogs
 * Queries platform-wide audit log entries with filters and cursor pagination.
 */
export const getAuditLogs = async (filters: IAuditLogFilterQuery) => {
  const { tenantId, userId, action, entityType, from, to, cursor, limit = 50 } = filters;

  const whereConditions: any = {
    ...(tenantId ? { instituteId: tenantId } : {}),
    ...(userId ? { userId } : {}),
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: new Date(to) } : {}),
          },
        }
      : {}),
  };

  const logs = await (prisma as any).auditLog.findMany({
    where: whereConditions,
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      institute: { select: { id: true, name: true, code: true } },
    },
  });

  let nextCursor: string | null = null;
  if (logs.length > limit) {
    const nextItem = logs.pop();
    nextCursor = nextItem.id;
  }

  return {
    items: logs,
    nextCursor,
  };
};

export const PlatformAdminService = {
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
};

export default PlatformAdminService;
