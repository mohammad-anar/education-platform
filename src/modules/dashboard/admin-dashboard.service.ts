import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import cacheHelper from "../../utils/cache.js";
import {
  IAdminDashboardData,
  IAdminDashboardFilterQuery,
  IChartDataPoint,
  IKPICard,
} from "./dashboard.interface.js";

/**
 * Validates tenant context for admin operations.
 */
export const validateAdminContext = (ctx: any) => {
  if (!ctx?.instituteId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Institute context is required.");
  }
  return ctx.instituteId;
};

/**
 * Invalidation key helper for admin dashboard caching.
 */
export const invalidateAdminDashboardCache = async (instituteId: string) => {
  try {
    await cacheHelper.delByPattern(`dash:admin:${instituteId}:*`);
  } catch {
    // Non-blocking
  }
};

/**
 * 1. getEnrollmentTrend
 * Monthly enrollment trend of students over the last 6 months.
 */
export const getEnrollmentTrend = async (
  ctx: any,
  query?: IAdminDashboardFilterQuery,
) => {
  const instituteId = validateAdminContext(ctx);

  const monthsBack = 6;
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 1);

  const enrollments = await (prisma as any).studentAcademicEnrollment.findMany({
    where: {
      student: { instituteId },
      enrolledAt: { gte: startDate },
    },
    select: { enrolledAt: true },
  });

  const monthMap: Record<string, number> = {};
  for (let i = 0; i < monthsBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthMap[key] = 0;
  }

  for (const e of enrollments) {
    const d = new Date(e.enrolledAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (monthMap[key] !== undefined) {
      monthMap[key]++;
    }
  }

  const chart: IChartDataPoint[] = Object.keys(monthMap)
    .sort()
    .map((month) => ({
      label: month,
      value: monthMap[month],
    }));

  const totalStudents = await (prisma as any).student.count({
    where: { instituteId, status: "ACTIVE" },
  });
  const activeEnrollments = await (prisma as any).studentAcademicEnrollment.count({
    where: { student: { instituteId }, status: "ACTIVE" },
  });

  const kpis: IKPICard[] = [
    {
      title: "Total Active Students",
      value: totalStudents,
      unit: "students",
      status: "neutral",
    },
    {
      title: "Active Academic Enrollments",
      value: activeEnrollments,
      unit: "enrollments",
      status: "positive",
    },
  ];

  return { kpis, chart };
};

/**
 * 2. getAttendanceRate
 * Institute-wide attendance distribution and rate.
 */
export const getAttendanceRate = async (
  ctx: any,
  query?: IAdminDashboardFilterQuery,
) => {
  const instituteId = validateAdminContext(ctx);

  const records = await (prisma as any).attendanceRecord.groupBy({
    by: ["status"],
    where: { instituteId },
    _count: { id: true },
  });

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const r of records) {
    if (r.status === "PRESENT") present += r._count.id;
    else if (r.status === "ABSENT") absent += r._count.id;
    else if (r.status === "LATE") late += r._count.id;
    else if (r.status === "EXCUSED" || r.status === "LEAVE") excused += r._count.id;
  }

  const total = present + absent + late + excused;
  const attendanceRate = total > 0 ? Number((((present + excused + late * 0.75) / total) * 100).toFixed(1)) : 100;

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
  const todaySessionsCount = await (prisma as any).attendanceSession.count({
    where: { instituteId, date: { gte: todayStart, lte: todayEnd } },
  });

  const chart: IChartDataPoint[] = [
    { label: "Present", value: present },
    { label: "Absent", value: absent },
    { label: "Late", value: late },
    { label: "Excused", value: excused },
  ];

  const kpis: IKPICard[] = [
    {
      title: "Institute Attendance Rate",
      value: attendanceRate,
      unit: "%",
      status: attendanceRate >= 80 ? "positive" : "negative",
    },
    {
      title: "Sessions Scheduled Today",
      value: todaySessionsCount,
      unit: "sessions",
      status: "neutral",
    },
  ];

  return { kpis, chart };
};

/**
 * 3. getResultPassRate
 * Academic result pass rate and GPA overview.
 */
export const getResultPassRate = async (
  ctx: any,
  query?: IAdminDashboardFilterQuery,
) => {
  const instituteId = validateAdminContext(ctx);

  const results = await (prisma as any).studentResult.findMany({
    where: {
      instituteId,
      ...(query?.academicYearId ? { academicYearId: query.academicYearId } : {}),
    },
    select: { percentage: true, gpa: true, grade: true },
    take: 1000,
  });

  let passed = 0;
  let failed = 0;
  let gpaSum = 0;
  let gpaCount = 0;

  for (const res of results) {
    const pct = res.percentage ? Number(res.percentage) : 0;
    if (pct >= 40) passed++;
    else failed++;

    if (res.gpa !== null && res.gpa !== undefined) {
      gpaSum += Number(res.gpa);
      gpaCount++;
    }
  }

  const total = results.length;
  const passRate = total > 0 ? Number(((passed / total) * 100).toFixed(1)) : 100;
  const avgGpa = gpaCount > 0 ? Number((gpaSum / gpaCount).toFixed(2)) : 0;

  const chart: IChartDataPoint[] = [
    { label: "Passed", value: passed },
    { label: "Failed", value: failed },
  ];

  const kpis: IKPICard[] = [
    {
      title: "Overall Pass Rate",
      value: passRate,
      unit: "%",
      status: passRate >= 75 ? "positive" : "negative",
    },
    {
      title: "Average GPA",
      value: avgGpa,
      unit: "GPA",
      status: avgGpa >= 3.0 ? "positive" : "neutral",
    },
  ];

  return { kpis, chart };
};

/**
 * 4. getLmsEngagement
 * Aggregate digital learning activities across courses.
 */
export const getLmsEngagement = async (
  ctx: any,
  query?: IAdminDashboardFilterQuery,
) => {
  const instituteId = validateAdminContext(ctx);

  const [completedItems, completedCourses, totalSubmissions, activeCourseEnrollments] =
    await Promise.all([
      (prisma as any).learningItemProgress.count({
        where: { instituteId, status: "COMPLETED" },
      }),
      (prisma as any).courseEnrollment.count({
        where: { instituteId, status: "COMPLETED" },
      }),
      (prisma as any).assignmentSubmission.count({
        where: { instituteId },
      }),
      (prisma as any).courseEnrollment.count({
        where: { instituteId, status: "ACTIVE" },
      }),
    ]);

  const chart: IChartDataPoint[] = [
    { label: "Learning Items Completed", value: completedItems },
    { label: "Courses Completed", value: completedCourses },
    { label: "Submissions Made", value: totalSubmissions },
    { label: "Active Enrollments", value: activeCourseEnrollments },
  ];

  const kpis: IKPICard[] = [
    {
      title: "Completed Courses",
      value: completedCourses,
      unit: "courses",
      status: "positive",
    },
    {
      title: "Active Course Enrollments",
      value: activeCourseEnrollments,
      unit: "learners",
      status: "neutral",
    },
  ];

  return { kpis, chart };
};

/**
 * 5. getTeacherWorkload
 * Teaching load, scheduled class routines, and course assignments per faculty member.
 */
export const getTeacherWorkload = async (ctx: any) => {
  const instituteId = validateAdminContext(ctx);

  const teachers = await (prisma as any).teacherProfile.findMany({
    where: { instituteId, employmentStatus: "ACTIVE" },
    include: {
      user: { select: { name: true, email: true } },
      classRoutines: { select: { id: true } },
      courseAssignments: { select: { courseId: true } },
    },
    take: 50,
  });

  const chart: IChartDataPoint[] = [];
  const items: any[] = [];
  let totalRoutineHours = 0;

  for (const t of teachers) {
    const routineCount = t.classRoutines.length;
    const coursesCount = t.courseAssignments.length;
    totalRoutineHours += routineCount;

    const teacherName = t.user?.name || t.employeeCode || "Faculty";

    chart.push({
      label: teacherName,
      value: routineCount,
    });

    items.push({
      teacherId: t.id,
      teacherName,
      employeeCode: t.employeeCode,
      weeklyRoutinesCount: routineCount,
      coursesAssignedCount: coursesCount,
    });
  }

  const avgWorkload = teachers.length > 0 ? Number((totalRoutineHours / teachers.length).toFixed(1)) : 0;

  const kpis: IKPICard[] = [
    {
      title: "Active Faculty Members",
      value: teachers.length,
      unit: "teachers",
      status: "neutral",
    },
    {
      title: "Average Weekly Routines / Teacher",
      value: avgWorkload,
      unit: "classes/wk",
      status: "neutral",
    },
  ];

  return { kpis, chart, items };
};

/**
 * 6. getSupportStats
 * Support ticket volume, status distribution, and live help session metrics.
 */
export const getSupportStats = async (ctx: any) => {
  const instituteId = validateAdminContext(ctx);

  const [ticketGroups, completedSessionsCount, ratings] = await Promise.all([
    (prisma as any).supportTicket.groupBy({
      by: ["status"],
      where: { instituteId },
      _count: { id: true },
    }),
    (prisma as any).supportSession.count({
      where: { instituteId, status: "COMPLETED" },
    }),
    (prisma as any).supportTicket.findMany({
      where: { instituteId, satisfactionRating: { not: null } },
      select: { satisfactionRating: true },
      take: 200,
    }),
  ]);

  let open = 0;
  let inProgress = 0;
  let resolved = 0;
  let closed = 0;

  for (const g of ticketGroups) {
    if (g.status === "OPEN") open += g._count.id;
    else if (g.status === "IN_PROGRESS") inProgress += g._count.id;
    else if (g.status === "RESOLVED") resolved += g._count.id;
    else if (g.status === "CLOSED") closed += g._count.id;
  }

  let ratingSum = 0;
  for (const r of ratings) {
    ratingSum += r.satisfactionRating;
  }
  const avgRating = ratings.length > 0 ? Number((ratingSum / ratings.length).toFixed(1)) : 5.0;

  const chart: IChartDataPoint[] = [
    { label: "Open", value: open },
    { label: "In Progress", value: inProgress },
    { label: "Resolved", value: resolved },
    { label: "Closed", value: closed },
  ];

  const kpis: IKPICard[] = [
    {
      title: "Open Support Tickets",
      value: open + inProgress,
      unit: "tickets",
      status: open + inProgress > 10 ? "negative" : "positive",
    },
    {
      title: "Completed Live Sessions",
      value: completedSessionsCount,
      unit: "sessions",
      status: "positive",
    },
    {
      title: "Avg Satisfaction Rating",
      value: avgRating,
      unit: "/ 5",
      status: avgRating >= 4 ? "positive" : "neutral",
    },
  ];

  return { kpis, chart };
};

/**
 * 7. getAdminDashboard
 * Master aggregator composing all admin metrics in ONE call, cached in Redis for 300s.
 */
export const getAdminDashboard = async (ctx: any): Promise<IAdminDashboardData> => {
  const instituteId = validateAdminContext(ctx);
  const cacheKey = `dash:admin:${instituteId}:all`;

  const cached = await cacheHelper.get<IAdminDashboardData>(cacheKey);
  if (cached) {
    return cached;
  }

  const [
    enrollmentTrendRes,
    attendanceRateRes,
    resultPassRateRes,
    lmsEngagementRes,
    teacherWorkloadRes,
    supportStatsRes,
    totalCoursesCount,
  ] = await Promise.all([
    getEnrollmentTrend(ctx),
    getAttendanceRate(ctx),
    getResultPassRate(ctx),
    getLmsEngagement(ctx),
    getTeacherWorkload(ctx),
    getSupportStats(ctx),
    (prisma as any).course.count({ where: { instituteId, status: "PUBLISHED" } }),
  ]);

  const dashboard: IAdminDashboardData = {
    instituteId,
    cachedAt: new Date().toISOString(),
    kpis: {
      totalStudents: enrollmentTrendRes.kpis[0],
      totalTeachers: teacherWorkloadRes.kpis[0],
      totalCourses: {
        title: "Active Courses",
        value: totalCoursesCount,
        unit: "courses",
        status: "neutral",
      },
      todayAttendanceRate: attendanceRateRes.kpis[0],
      overallPassRate: resultPassRateRes.kpis[0],
      openSupportTickets: supportStatsRes.kpis[0],
    },
    charts: {
      enrollmentTrend: enrollmentTrendRes.chart,
      attendanceRate: attendanceRateRes.chart,
      resultPassRate: resultPassRateRes.chart,
      lmsEngagement: lmsEngagementRes.chart,
      teacherWorkload: teacherWorkloadRes.chart,
      supportStats: supportStatsRes.chart,
    },
  };

  await cacheHelper.set(cacheKey, dashboard, 300);

  return dashboard;
};

export const AdminDashboardService = {
  validateAdminContext,
  invalidateAdminDashboardCache,
  getEnrollmentTrend,
  getAttendanceRate,
  getResultPassRate,
  getLmsEngagement,
  getTeacherWorkload,
  getSupportStats,
  getAdminDashboard,
};

export default AdminDashboardService;
