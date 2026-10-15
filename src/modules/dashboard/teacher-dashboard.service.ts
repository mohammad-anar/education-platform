import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import cacheHelper from "../../utils/cache.js";
import {
  IChartDataPoint,
  IKPICard,
  ITeacherDashboardData,
  ITeacherDashboardFilterQuery,
} from "./dashboard.interface.js";

/**
 * Resolves the TeacherProfile for the authenticated user and tenant institute.
 * Strictly verifies tenant isolation and assigned scope.
 *
 * @param ctx Authenticated request context
 * @returns {Promise<any>} TeacherProfile record with relations
 */
export const resolveTeacherContext = async (ctx: any) => {
  if (!ctx?.userId || !ctx?.instituteId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Valid authenticated tenant context required");
  }

  const teacher = await (prisma as any).teacherProfile.findFirst({
    where: {
      userId: ctx.userId,
      instituteId: ctx.instituteId,
      employmentStatus: "ACTIVE",
    },
    include: {
      courseAssignments: { select: { courseId: true } },
      classAssignments: { select: { classGroupId: true } },
      classRoutines: {
        select: {
          id: true,
          classGroupId: true,
          sectionId: true,
          subjectId: true,
          courseId: true,
        },
      },
    },
  });

  if (!teacher) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Active teacher profile not found for this user in the current institute.",
    );
  }

  const assignedCourseIds: string[] = teacher.courseAssignments.map((c: any) => c.courseId);
  const assignedClassGroupIds: string[] = Array.from(
    new Set([
      ...teacher.classAssignments.map((ca: any) => ca.classGroupId),
      ...teacher.classRoutines.map((cr: any) => cr.classGroupId),
    ]),
  );
  const assignedSectionIds: string[] = Array.from(
    new Set(teacher.classRoutines.map((cr: any) => cr.sectionId).filter(Boolean)),
  );
  const assignedSubjectIds: string[] = Array.from(
    new Set(teacher.classRoutines.map((cr: any) => cr.subjectId).filter(Boolean)),
  );

  return {
    teacher,
    teacherId: teacher.id,
    assignedCourseIds,
    assignedClassGroupIds,
    assignedSectionIds,
    assignedSubjectIds,
  };
};

/**
 * Invalidation key helper for teacher dashboard caching.
 */
export const invalidateTeacherDashboardCache = async (teacherId: string) => {
  try {
    await cacheHelper.delByPattern(`dash:teacher:${teacherId}:*`);
  } catch {
    // Non-blocking cache clear
  }
};

/**
 * 1. getTodayClasses
 * Retrieves scheduled routines, attendance sessions, and live classes for the teacher today.
 */
export const getTodayClasses = async (ctx: any) => {
  const { teacherId, assignedClassGroupIds } = await resolveTeacherContext(ctx);

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sunday ... 6=Saturday
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [routines, sessionsToday, liveClassesToday] = await Promise.all([
    (prisma as any).classRoutine.findMany({
      where: {
        teacherId,
        instituteId: ctx.instituteId,
        dayOfWeek,
      },
      include: {
        classGroup: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        course: { select: { id: true, name: true, code: true } },
      },
      orderBy: { startTime: "asc" },
    }),
    (prisma as any).attendanceSession.findMany({
      where: {
        teacherId,
        instituteId: ctx.instituteId,
        date: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        classGroupId: true,
        sectionId: true,
        subjectId: true,
        status: true,
        openedAt: true,
        closedAt: true,
      },
    }),
    (prisma as any).liveClass.findMany({
      where: {
        teacherId,
        instituteId: ctx.instituteId,
        scheduledStartTime: { gte: startOfDay, lte: endOfDay },
      },
      select: {
        id: true,
        title: true,
        meetingUrl: true,
        scheduledStartTime: true,
        status: true,
      },
    }),
  ]);

  const items = routines.map((r: any) => {
    const session = sessionsToday.find(
      (s: any) =>
        s.classGroupId === r.classGroupId &&
        (!r.sectionId || s.sectionId === r.sectionId) &&
        (!r.subjectId || s.subjectId === r.subjectId),
    );

    return {
      routineId: r.id,
      classGroup: r.classGroup?.name || "General",
      section: r.section?.name || null,
      subject: r.subject?.name || r.course?.name || "Standard Lecture",
      room: r.room || null,
      startTime: r.startTime,
      endTime: r.endTime,
      attendanceSessionId: session?.id || null,
      attendanceStatus: session ? session.status : "NOT_STARTED",
    };
  });

  const kpis: IKPICard[] = [
    {
      title: "Today's Classes",
      value: routines.length,
      unit: "sessions",
      status: "neutral",
    },
    {
      title: "Completed Attendance",
      value: sessionsToday.filter((s: any) => s.status === "COMPLETED").length,
      unit: "sessions",
      status: "positive",
    },
    {
      title: "Live Online Classes",
      value: liveClassesToday.length,
      unit: "meetings",
      status: "neutral",
    },
  ];

  return { kpis, items, liveClasses: liveClassesToday };
};

/**
 * 2. getPendingAttendance
 * Retrieves past or current sessions where attendance has not been completed.
 */
export const getPendingAttendance = async (ctx: any) => {
  const { teacherId } = await resolveTeacherContext(ctx);

  const now = new Date();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const pendingSessions = await (prisma as any).attendanceSession.findMany({
    where: {
      teacherId,
      instituteId: ctx.instituteId,
      date: { gte: thirtyDaysAgo, lte: now },
      status: { in: ["SCHEDULED", "OPEN"] },
    },
    include: {
      classGroup: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    take: 50,
  });

  const items = pendingSessions.map((s: any) => ({
    sessionId: s.id,
    date: s.date,
    classGroup: s.classGroup?.name || "Standard Class",
    section: s.section?.name || null,
    subject: s.subject?.name || "Subject Lecture",
    status: s.status,
    openedAt: s.openedAt,
  }));

  const kpis: IKPICard[] = [
    {
      title: "Pending Attendance Sessions",
      value: items.length,
      unit: "sessions",
      status: items.length > 0 ? "negative" : "positive",
      description: "Sessions awaiting faculty completion",
    },
  ];

  return { kpis, items };
};

/**
 * 3. getPendingGrading
 * Retrieves assignments and exam components waiting for marks / evaluation.
 */
export const getPendingGrading = async (ctx: any) => {
  const { assignedCourseIds, assignedClassGroupIds } = await resolveTeacherContext(ctx);

  const [assignmentSubmissions, pendingExamMarks] = await Promise.all([
    (prisma as any).assignmentSubmission.findMany({
      where: {
        instituteId: ctx.instituteId,
        marks: null,
        status: "SUBMITTED",
        assignment: {
          assessment: {
            OR: [
              { courseId: { in: assignedCourseIds } },
              { classGroupId: { in: assignedClassGroupIds } },
            ],
          },
        },
      },
      include: {
        assignment: { select: { id: true, title: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      },
      orderBy: { submittedAt: "asc" },
      take: 50,
    }),
    (prisma as any).examMark.findMany({
      where: {
        instituteId: ctx.instituteId,
        status: "DRAFT",
        exam: {
          OR: [
            { courseId: { in: assignedCourseIds } },
            { classGroupId: { in: assignedClassGroupIds } },
          ],
        },
      },
      include: {
        exam: { select: { id: true, name: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      },
      take: 50,
    }),
  ]);

  const items = [
    ...assignmentSubmissions.map((sub: any) => ({
      id: sub.id,
      type: "ASSIGNMENT",
      title: sub.assignment?.title || "Assignment Submission",
      studentName: `${sub.student?.firstName} ${sub.student?.lastName}`,
      studentCode: sub.student?.studentCode,
      submittedAt: sub.submittedAt,
    })),
    ...pendingExamMarks.map((em: any) => ({
      id: em.id,
      type: "EXAM_MARK",
      title: em.exam?.name || "Exam Evaluation",
      studentName: `${em.student?.firstName} ${em.student?.lastName}`,
      studentCode: em.student?.studentCode,
      submittedAt: em.enteredAt,
    })),
  ];

  const kpis: IKPICard[] = [
    {
      title: "Pending Evaluations",
      value: items.length,
      unit: "items",
      status: items.length > 5 ? "negative" : "neutral",
      description: "Submissions awaiting score entry and feedback",
    },
  ];

  return { kpis, items };
};

/**
 * 4. getClassAttendanceStats
 * Generates chart-ready attendance distributions across classes taught by the teacher.
 */
export const getClassAttendanceStats = async (
  ctx: any,
  query?: ITeacherDashboardFilterQuery,
) => {
  const { teacherId } = await resolveTeacherContext(ctx);

  const recordsGrouped = await (prisma as any).attendanceRecord.groupBy({
    by: ["status"],
    where: {
      session: {
        teacherId,
        instituteId: ctx.instituteId,
        ...(query?.classGroupId ? { classGroupId: query.classGroupId } : {}),
      },
    },
    _count: { id: true },
  });

  let present = 0;
  let absent = 0;
  let late = 0;
  let excused = 0;

  for (const group of recordsGrouped) {
    if (group.status === "PRESENT") present += group._count.id;
    else if (group.status === "ABSENT") absent += group._count.id;
    else if (group.status === "LATE") late += group._count.id;
    else if (group.status === "EXCUSED" || group.status === "LEAVE") excused += group._count.id;
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
      title: "Average Attendance Rate",
      value: attendanceRate,
      unit: "%",
      status: attendanceRate >= 75 ? "positive" : "negative",
    },
    {
      title: "Total Records Marked",
      value: total,
      unit: "records",
      status: "neutral",
    },
  ];

  return { kpis, chart };
};

/**
 * 5. getAssignmentSubmissionRate
 * Computes assignment submissions vs expected student count in teacher's courses.
 */
export const getAssignmentSubmissionRate = async (
  ctx: any,
  query?: ITeacherDashboardFilterQuery,
) => {
  const { assignedCourseIds } = await resolveTeacherContext(ctx);

  const targetCourseIds = query?.courseId ? [query.courseId] : assignedCourseIds;

  const [activeEnrollmentsCount, submissionsCount, gradedCount] = await Promise.all([
    (prisma as any).courseEnrollment.count({
      where: {
        courseId: { in: targetCourseIds },
        status: "ACTIVE",
      },
    }),
    (prisma as any).assignmentSubmission.count({
      where: {
        assignment: {
          assessment: { courseId: { in: targetCourseIds } },
        },
      },
    }),
    (prisma as any).assignmentSubmission.count({
      where: {
        assignment: {
          assessment: { courseId: { in: targetCourseIds } },
        },
        marks: { not: null },
      },
    }),
  ]);

  const missing = Math.max(0, activeEnrollmentsCount - submissionsCount);
  const submissionRate =
    activeEnrollmentsCount > 0
      ? Number(((submissionsCount / activeEnrollmentsCount) * 100).toFixed(1))
      : 0;

  const chart: IChartDataPoint[] = [
    { label: "Submitted", value: submissionsCount },
    { label: "Missing", value: missing },
    { label: "Graded", value: gradedCount },
  ];

  const kpis: IKPICard[] = [
    {
      title: "Submission Rate",
      value: submissionRate,
      unit: "%",
      status: submissionRate >= 70 ? "positive" : "negative",
    },
    {
      title: "Total Submissions",
      value: submissionsCount,
      unit: "submissions",
      status: "neutral",
    },
  ];

  return { kpis, chart };
};

/**
 * 6. getQuizPerformance
 * Returns distribution of quiz scores across teacher's assessments.
 */
export const getQuizPerformance = async (
  ctx: any,
  query?: ITeacherDashboardFilterQuery,
) => {
  const { assignedCourseIds, assignedClassGroupIds } = await resolveTeacherContext(ctx);

  const results = await (prisma as any).assessmentResult.findMany({
    where: {
      assessment: {
        instituteId: ctx.instituteId,
        OR: [
          { courseId: { in: query?.courseId ? [query.courseId] : assignedCourseIds } },
          { classGroupId: { in: query?.classGroupId ? [query.classGroupId] : assignedClassGroupIds } },
        ],
      },
    },
    select: { percentage: true, marks: true },
    take: 500,
  });

  let excellent = 0; // 90-100%
  let good = 0;      // 75-89%
  let average = 0;   // 50-74%
  let needsHelp = 0; // <50%

  let totalPercent = 0;
  for (const r of results) {
    const pct = r.percentage ? Number(r.percentage) : 0;
    totalPercent += pct;
    if (pct >= 90) excellent++;
    else if (pct >= 75) good++;
    else if (pct >= 50) average++;
    else needsHelp++;
  }

  const avgScore = results.length > 0 ? Number((totalPercent / results.length).toFixed(1)) : 0;

  const chart: IChartDataPoint[] = [
    { label: "90-100% (A+)", value: excellent },
    { label: "75-89% (B)", value: good },
    { label: "50-74% (Pass)", value: average },
    { label: "<50% (At Risk)", value: needsHelp },
  ];

  const kpis: IKPICard[] = [
    {
      title: "Average Quiz Score",
      value: avgScore,
      unit: "%",
      status: avgScore >= 65 ? "positive" : "negative",
    },
    {
      title: "Quizzes Evaluated",
      value: results.length,
      unit: "attempts",
      status: "neutral",
    },
  ];

  return { kpis, chart };
};

/**
 * 7. getCourseCompletionFunnel
 * Generates funnel analytics for students moving through assigned LMS courses.
 */
export const getCourseCompletionFunnel = async (
  ctx: any,
  query?: ITeacherDashboardFilterQuery,
) => {
  const { assignedCourseIds } = await resolveTeacherContext(ctx);

  const targetCourseIds = query?.courseId ? [query.courseId] : assignedCourseIds;

  const enrollments = await (prisma as any).courseEnrollment.findMany({
    where: {
      courseId: { in: targetCourseIds },
    },
    select: { progressPercent: true, status: true },
  });

  const totalEnrolled = enrollments.length;
  let started = 0;
  let halfway = 0;
  let completed = 0;

  for (const e of enrollments) {
    const p = Number(e.progressPercent || 0);
    if (p > 0 || e.status === "ACTIVE") started++;
    if (p >= 50) halfway++;
    if (p >= 100 || e.status === "COMPLETED") completed++;
  }

  const chart: IChartDataPoint[] = [
    { label: "Enrolled", value: totalEnrolled },
    { label: "Started Learning", value: started },
    { label: "Halfway (>50%)", value: halfway },
    { label: "Completed", value: completed },
  ];

  const completionRate = totalEnrolled > 0 ? Number(((completed / totalEnrolled) * 100).toFixed(1)) : 0;

  const kpis: IKPICard[] = [
    {
      title: "Course Completion Rate",
      value: completionRate,
      unit: "%",
      status: completionRate >= 50 ? "positive" : "neutral",
    },
    {
      title: "Total Learners Enrolled",
      value: totalEnrolled,
      unit: "students",
      status: "neutral",
    },
  ];

  return { kpis, chart };
};

/**
 * 8. getAtRiskStudents
 * Identifies learners requiring faculty intervention based on 3 explicit rules:
 *  - Attendance < policy (below 75% or policy threshold)
 *  - 2+ overdue items (unsubmitted past due)
 *  - No activity in 7 days (no attendance or learning progress updates)
 */
export const getAtRiskStudents = async (
  ctx: any,
  query?: ITeacherDashboardFilterQuery,
) => {
  const { teacherId, assignedClassGroupIds, assignedCourseIds } = await resolveTeacherContext(ctx);

  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Fetch active students enrolled in teacher's classes or courses
  const students = await (prisma as any).student.findMany({
    where: {
      instituteId: ctx.instituteId,
      status: "ACTIVE",
      OR: [
        { academicEnrollments: { some: { classGroupId: { in: assignedClassGroupIds }, status: "ACTIVE" } } },
        { courseEnrollments: { some: { courseId: { in: assignedCourseIds }, status: "ACTIVE" } } },
      ],
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentCode: true,
      attendanceRecords: {
        where: { session: { teacherId } },
        select: { status: true, markedAt: true },
      },
      assignmentSubmissions: {
        select: { assignmentId: true, submittedAt: true },
      },
      learningItemProgress: {
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      academicEnrollments: {
        where: { status: "ACTIVE" },
        include: { classGroup: { select: { name: true } }, section: { select: { name: true } } },
      },
    },
    take: 200,
  });

  // Fetch overdue assignments in teacher's scope
  const overdueAssignments = await (prisma as any).assignment.findMany({
    where: {
      dueAt: { lt: now },
      assessment: {
        instituteId: ctx.instituteId,
        OR: [
          { courseId: { in: assignedCourseIds } },
          { classGroupId: { in: assignedClassGroupIds } },
        ],
      },
    },
    select: { id: true },
  });
  const overdueIds = new Set(overdueAssignments.map((a: any) => a.id));

  const atRiskList: any[] = [];

  for (const st of students) {
    const riskReasons: string[] = [];

    // Rule 1: Attendance < Policy (75%)
    const totalSessions = st.attendanceRecords.length;
    let presentCount = 0;
    let latestActivity: Date | null = null;

    for (const rec of st.attendanceRecords) {
      if (rec.status === "PRESENT" || rec.status === "EXCUSED") presentCount++;
      if (rec.status === "LATE") presentCount += 0.75;
      if (rec.markedAt && (!latestActivity || rec.markedAt > latestActivity)) {
        latestActivity = rec.markedAt;
      }
    }

    const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 100;
    if (totalSessions >= 3 && attendanceRate < 75) {
      riskReasons.push(`Low Attendance (${attendanceRate.toFixed(1)}% < 75%)`);
    }

    // Rule 2: 2+ overdue items
    const submittedIds = new Set(st.assignmentSubmissions.map((s: any) => s.assignmentId));
    let unsubmittedOverdue = 0;
    for (const id of overdueIds) {
      if (!submittedIds.has(id)) unsubmittedOverdue++;
    }
    if (unsubmittedOverdue >= 2) {
      riskReasons.push(`${unsubmittedOverdue} overdue assignments unsubmitted`);
    }

    // Rule 3: No activity in 7 days
    if (st.learningItemProgress.length > 0) {
      const lmsUpdated = st.learningItemProgress[0].updatedAt;
      if (!latestActivity || lmsUpdated > latestActivity) {
        latestActivity = lmsUpdated;
      }
    }

    if (!latestActivity || latestActivity < sevenDaysAgo) {
      riskReasons.push("No attendance or course activity in the last 7 days");
    }

    if (riskReasons.length > 0) {
      const riskLevel =
        riskReasons.length >= 2 ? "CRITICAL" : attendanceRate < 60 || unsubmittedOverdue >= 3 ? "HIGH" : "MEDIUM";

      atRiskList.push({
        studentId: st.id,
        fullName: `${st.firstName} ${st.lastName}`,
        studentCode: st.studentCode,
        classGroup: st.academicEnrollments[0]?.classGroup?.name || "General",
        section: st.academicEnrollments[0]?.section?.name || null,
        attendanceRate: Number(attendanceRate.toFixed(1)),
        overdueItemsCount: unsubmittedOverdue,
        riskLevel,
        riskReasons,
      });
    }
  }

  const kpis: IKPICard[] = [
    {
      title: "At-Risk Students",
      value: atRiskList.length,
      unit: "students",
      status: atRiskList.length > 0 ? "negative" : "positive",
      description: "Students requiring faculty follow-up",
    },
  ];

  return { kpis, items: atRiskList };
};

/**
 * 9. getTeacherDashboard
 * Master aggregator composing all teacher metrics in ONE call, cached in Redis for 120s.
 */
export const getTeacherDashboard = async (ctx: any): Promise<ITeacherDashboardData> => {
  const { teacherId, teacher } = await resolveTeacherContext(ctx);
  const cacheKey = `dash:teacher:${teacherId}:all`;

  // Check Redis cache first
  const cached = await cacheHelper.get<ITeacherDashboardData>(cacheKey);
  if (cached) {
    return cached;
  }

  // Compose in parallel using Promise.all
  const [
    todayClassesRes,
    pendingAttendanceRes,
    pendingGradingRes,
    classAttendanceRes,
    submissionRateRes,
    quizPerfRes,
    completionFunnelRes,
    atRiskRes,
  ] = await Promise.all([
    getTodayClasses(ctx),
    getPendingAttendance(ctx),
    getPendingGrading(ctx),
    getClassAttendanceStats(ctx),
    getAssignmentSubmissionRate(ctx),
    getQuizPerformance(ctx),
    getCourseCompletionFunnel(ctx),
    getAtRiskStudents(ctx),
  ]);

  const dashboard: ITeacherDashboardData = {
    teacherId,
    employeeCode: teacher.employeeCode,
    cachedAt: new Date().toISOString(),
    kpis: {
      todayClassesCount: todayClassesRes.kpis[0],
      pendingAttendanceCount: pendingAttendanceRes.kpis[0],
      pendingGradingCount: pendingGradingRes.kpis[0],
      totalAssignedStudents: completionFunnelRes.kpis[1],
      averageAttendanceRate: classAttendanceRes.kpis[0],
      atRiskStudentsCount: atRiskRes.kpis[0],
    },
    charts: {
      classAttendanceStats: classAttendanceRes.chart,
      assignmentSubmissionRate: submissionRateRes.chart,
      quizPerformance: quizPerfRes.chart,
      courseCompletionFunnel: completionFunnelRes.chart,
    },
    todayClasses: todayClassesRes.items,
    pendingAttendance: pendingAttendanceRes.items,
    pendingGrading: pendingGradingRes.items,
    atRiskStudents: atRiskRes.items,
  };

  // Cache in Redis for 120s
  await cacheHelper.set(cacheKey, dashboard, 120);

  return dashboard;
};

export const TeacherDashboardService = {
  resolveTeacherContext,
  invalidateTeacherDashboardCache,
  getTodayClasses,
  getPendingAttendance,
  getPendingGrading,
  getClassAttendanceStats,
  getAssignmentSubmissionRate,
  getQuizPerformance,
  getCourseCompletionFunnel,
  getAtRiskStudents,
  getTeacherDashboard,
};

export default TeacherDashboardService;
