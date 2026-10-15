import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import cacheHelper from "../../utils/cache.js";
import {
  IChartDataPoint,
  IGuardianChildSummary,
  IGuardianDashboardData,
  IGuardianDashboardFilterQuery,
  IKPICard,
} from "./dashboard.interface.js";

/**
 * Resolves the Guardian record for the current authenticated user and tenant institute.
 */
export const resolveGuardianContext = async (ctx: any) => {
  if (!ctx?.userId || !ctx?.instituteId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Valid authenticated tenant context required");
  }

  const guardian = await (prisma as any).guardian.findFirst({
    where: {
      userId: ctx.userId,
      instituteId: ctx.instituteId,
      status: "ACTIVE",
    },
    include: {
      students: {
        include: {
          student: {
            include: {
              academicEnrollments: {
                where: { status: "ACTIVE" },
                include: {
                  classGroup: { select: { id: true, name: true } },
                  section: { select: { id: true, name: true } },
                },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!guardian) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Active guardian profile not found for this user in the current institute.",
    );
  }

  const availableChildren: IGuardianChildSummary[] = guardian.students.map((sg: any) => {
    const enrollment = sg.student.academicEnrollments?.[0];
    return {
      childId: sg.studentId,
      studentCode: sg.student.studentCode,
      fullName: `${sg.student.firstName} ${sg.student.lastName}`.trim(),
      relationship: sg.relationship,
      isPrimary: sg.isPrimary,
      canViewAcademic: sg.canViewAcademic,
      canViewFinance: sg.canViewFinance,
      classGroup: enrollment?.classGroup?.name || null,
      section: enrollment?.section?.name || null,
      rollNumber: enrollment?.rollNumber || null,
      photoUrl: null,
    };
  });

  return { guardian, guardianId: guardian.id, availableChildren };
};

/**
 * Verifies that a specific student is linked to the guardian in the current institute.
 */
export const verifyChildAccess = async (ctx: any, childId: string) => {
  const { guardian, availableChildren } = await resolveGuardianContext(ctx);

  const link = guardian.students.find((sg: any) => sg.studentId === childId);
  if (!link) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "The requested student is not a registered ward of your guardian account.",
    );
  }

  const childSummary = availableChildren.find((c) => c.childId === childId)!;

  return {
    guardian,
    guardianId: guardian.id,
    link,
    childSummary,
    student: link.student,
  };
};

/**
 * Invalidation key helper for guardian dashboard caching.
 */
export const invalidateGuardianDashboardCache = async (guardianId: string, childId?: string) => {
  try {
    if (childId) {
      await cacheHelper.del(`dash:guardian:${guardianId}:${childId}:all`);
    } else {
      await cacheHelper.delByPattern(`dash:guardian:${guardianId}:*`);
    }
  } catch {
    // Non-blocking
  }
};

/**
 * 1. listChildren
 * Returns all children/wards registered to this guardian for switching.
 */
export const listChildren = async (ctx: any) => {
  const { availableChildren } = await resolveGuardianContext(ctx);
  const primaryChild = availableChildren.find((c) => c.isPrimary) || availableChildren[0] || null;

  return {
    primaryChildId: primaryChild?.childId || null,
    children: availableChildren,
  };
};

/**
 * 2. getChildAttendance
 * Attendance records, summary and chart breakdown for a specific ward.
 */
export const getChildAttendance = async (
  ctx: any,
  childId: string,
  query?: IGuardianDashboardFilterQuery,
) => {
  await verifyChildAccess(ctx, childId);

  const records = await (prisma as any).attendanceRecord.findMany({
    where: {
      studentId: childId,
      instituteId: ctx.instituteId,
    },
    include: {
      session: {
        include: {
          classGroup: { select: { name: true } },
          section: { select: { name: true } },
          subject: { select: { name: true } },
        },
      },
    },
    orderBy: { session: { date: "desc" } },
    take: 30,
  });

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const r of records) {
    if (r.status === "PRESENT") present++;
    else if (r.status === "ABSENT") absent++;
    else if (r.status === "LATE") late++;
    else excused++;
  }

  const total = present + absent + late + excused;
  const attendanceRate = total > 0 ? Number((((present + excused + late * 0.75) / total) * 100).toFixed(1)) : 100;

  const chart: IChartDataPoint[] = [
    { label: "Present", value: present },
    { label: "Absent", value: absent },
    { label: "Late", value: late },
    { label: "Excused", value: excused },
  ];

  const kpis: IKPICard[] = [
    {
      title: "Attendance Rate",
      value: attendanceRate,
      unit: "%",
      status: attendanceRate >= 80 ? "positive" : "negative",
    },
    {
      title: "Total Days Tracked",
      value: total,
      unit: "days",
      status: "neutral",
    },
    {
      title: "Absences",
      value: absent,
      unit: "days",
      status: absent > 3 ? "negative" : "positive",
    },
  ];

  const recentRecords = records.slice(0, 10).map((r: any) => ({
    date: r.session.date,
    status: r.status,
    subject: r.session.subject?.name || "General Session",
    remarks: r.remarks,
  }));

  return { kpis, chart, recentRecords };
};

/**
 * 3. getChildResults
 * Exam and assessment results for a specific ward.
 * Strictly verifies canViewAcademic permission.
 */
export const getChildResults = async (
  ctx: any,
  childId: string,
  query?: IGuardianDashboardFilterQuery,
) => {
  const { link } = await verifyChildAccess(ctx, childId);

  // Strict Academic View Gate
  if (!link.canViewAcademic) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Academic records viewing is restricted for this child by institute administration.",
    );
  }

  const results = await (prisma as any).studentResult.findMany({
    where: {
      studentId: childId,
      instituteId: ctx.instituteId,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      academicYear: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const chart: IChartDataPoint[] = results.map((res: any) => ({
    label: res.subject?.name || "Subject",
    value: res.percentage ? Number(res.percentage) : res.calculatedMarks ? Number(res.calculatedMarks) : 0,
    gpa: res.gpa ? Number(res.gpa) : null,
    grade: res.grade,
  }));

  let gpaSum = 0;
  let gpaCount = 0;
  for (const r of results) {
    if (r.gpa !== null && r.gpa !== undefined) {
      gpaSum += Number(r.gpa);
      gpaCount++;
    }
  }

  const averageGpa = gpaCount > 0 ? Number((gpaSum / gpaCount).toFixed(2)) : 0;

  const kpis: IKPICard[] = [
    {
      title: "Cumulative GPA",
      value: averageGpa,
      unit: "GPA",
      status: averageGpa >= 3.0 ? "positive" : "neutral",
    },
    {
      title: "Exams Evaluated",
      value: results.length,
      unit: "evaluations",
      status: "neutral",
    },
  ];

  const recentResults = results.slice(0, 10).map((r: any) => ({
    id: r.id,
    subject: r.subject?.name,
    calculatedMarks: r.calculatedMarks,
    percentage: r.percentage,
    gpa: r.gpa,
    grade: r.grade,
    publishedAt: r.createdAt,
  }));

  return { kpis, chart, recentResults };
};

/**
 * 4. getChildNotices
 * Notices visible to the child's class, section, program, or institute-wide.
 */
export const getChildNotices = async (ctx: any, childId: string) => {
  const { student } = await verifyChildAccess(ctx, childId);

  const activeEnrollment = student.academicEnrollments?.[0];
  const classGroupId = activeEnrollment?.classGroupId;
  const sectionId = activeEnrollment?.sectionId;

  const now = new Date();

  const notices = await (prisma as any).notice.findMany({
    where: {
      instituteId: ctx.instituteId,
      status: "PUBLISHED",
      deletedAt: null,
      publishAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      AND: [
        {
          OR: [
            { audiences: { none: {} } },
            {
              audiences: {
                some: {
                  OR: [
                    { audienceType: "INSTITUTE" },
                    ...(classGroupId ? [{ audienceType: "CLASS", audienceId: classGroupId }] : []),
                    ...(sectionId ? [{ audienceType: "SECTION", audienceId: sectionId }] : []),
                  ],
                },
              },
            },
          ],
        },
      ],
    },
    orderBy: [{ pinned: "desc" }, { publishAt: "desc" }],
    take: 10,
    select: {
      id: true,
      title: true,
      content: true,
      category: true,
      pinned: true,
      publishAt: true,
      expiresAt: true,
    },
  });

  return notices;
};

/**
 * 5. getGuardianDashboard
 * Master aggregator for guardian child monitoring, cached in Redis for 120s.
 */
export const getGuardianDashboard = async (
  ctx: any,
  requestedChildId?: string,
): Promise<IGuardianDashboardData> => {
  const { guardianId, availableChildren } = await resolveGuardianContext(ctx);

  if (availableChildren.length === 0) {
    return {
      guardianId,
      activeChild: null,
      availableChildren: [],
      cachedAt: new Date().toISOString(),
      notices: [],
    };
  }

  // Select target child
  const targetChildId =
    requestedChildId ||
    availableChildren.find((c) => c.isPrimary)?.childId ||
    availableChildren[0].childId;

  const cacheKey = `dash:guardian:${guardianId}:${targetChildId}:all`;

  const cached = await cacheHelper.get<IGuardianDashboardData>(cacheKey);
  if (cached) {
    return cached;
  }

  const childSummary = availableChildren.find((c) => c.childId === targetChildId);
  if (!childSummary) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Requested child is not a registered ward of your account.",
    );
  }

  // Fetch in parallel
  const [attendanceRes, noticesRes, enrolledCoursesCount, upcomingExamsCount] =
    await Promise.all([
      getChildAttendance(ctx, targetChildId),
      getChildNotices(ctx, targetChildId),
      (prisma as any).courseEnrollment.count({
        where: { studentId: targetChildId, status: "ACTIVE" },
      }),
      (prisma as any).exam.count({
        where: {
          instituteId: ctx.instituteId,
          startDate: { gte: new Date() },
        },
      }),
    ]);

  let resultsRes: any = null;
  if (childSummary.canViewAcademic) {
    resultsRes = await getChildResults(ctx, targetChildId);
  }

  const kpis = {
    attendanceRate: attendanceRes.kpis[0],
    gpa: resultsRes
      ? resultsRes.kpis[0]
      : {
          title: "Cumulative GPA",
          value: "Restricted",
          description: "Academic view disabled",
          status: "neutral" as const,
        },
    enrolledCoursesCount: {
      title: "Enrolled Courses",
      value: enrolledCoursesCount,
      unit: "courses",
      status: "neutral" as const,
    },
    upcomingExamsCount: {
      title: "Upcoming Exams",
      value: upcomingExamsCount,
      unit: "exams",
      status: "neutral" as const,
    },
    unreadNoticesCount: {
      title: "Active Notices",
      value: noticesRes.length,
      unit: "notices",
      status: "neutral" as const,
    },
  };

  const dashboard: IGuardianDashboardData = {
    guardianId,
    activeChild: childSummary,
    availableChildren,
    cachedAt: new Date().toISOString(),
    kpis,
    attendance: {
      chart: attendanceRes.chart,
      recentRecords: attendanceRes.recentRecords,
    },
    results: resultsRes
      ? {
          chart: resultsRes.chart,
          recentResults: resultsRes.recentResults,
        }
      : {
          chart: [],
          recentResults: [],
          isRestricted: true,
        },
    notices: noticesRes,
  };

  await cacheHelper.set(cacheKey, dashboard, 120);

  return dashboard;
};

export const GuardianDashboardService = {
  resolveGuardianContext,
  verifyChildAccess,
  invalidateGuardianDashboardCache,
  listChildren,
  getChildAttendance,
  getChildResults,
  getChildNotices,
  getGuardianDashboard,
};

export default GuardianDashboardService;
