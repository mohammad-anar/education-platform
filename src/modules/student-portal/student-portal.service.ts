import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import cacheHelper from "../../utils/cache.js";

/**
 * Resolves the verified studentId belonging to the authenticated auth context.
 * Guarantees that queries are strictly scoped to the authenticated student and cannot be spoofed.
 *
 * @param ctx The authenticated context from req.ctx.
 * @returns {Promise<string>} The student record UUID.
 */
export const resolveStudentId = async (ctx: any): Promise<string> => {
  if (ctx?.studentId) return ctx.studentId;
  if (!ctx?.userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required.");
  }

  const student = await (prisma as any).student.findFirst({
    where: {
      userId: ctx.userId,
      ...(ctx.instituteId ? { instituteId: ctx.instituteId } : {}),
    },
    select: { id: true, instituteId: true },
  });

  if (!student) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Student profile not found for this user.");
  }

  ctx.studentId = student.id;
  if (!ctx.instituteId) {
    ctx.instituteId = student.instituteId;
  }

  return student.id;
};

/**
 * 1. Today's Summary
 * Retrieves today's routine with calendar exceptions and attendance status for each slot.
 */
export const getTodaySummary = async (ctx: any) => {
  const studentId = await resolveStudentId(ctx);
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const dayOfWeek = now.getDay(); // 0=Sunday, 1=Monday...

  // 1. Resolve student's active academic enrollment for class and section
  const enrollment = await (prisma as any).studentAcademicEnrollment.findFirst({
    where: { studentId, status: "ACTIVE" },
    select: { classGroupId: true, sectionId: true, academicYearId: true },
  });

  if (!enrollment?.classGroupId) {
    return [];
  }

  // 2. Fetch class routines for today
  const routines = await (prisma as any).classRoutine.findMany({
    where: {
      instituteId: ctx.instituteId,
      classGroupId: enrollment.classGroupId,
      ...(enrollment.sectionId
        ? { OR: [{ sectionId: enrollment.sectionId }, { sectionId: null }] }
        : {}),
      dayOfWeek,
      status: "ACTIVE",
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      teacher: {
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  // 3. Check for calendar exceptions for today
  const exceptions = await (prisma as any).attendanceCalendarException.findMany({
    where: {
      date: { gte: startOfDay, lte: endOfDay },
      calendar: { instituteId: ctx.instituteId },
    },
  });
  const isHoliday = exceptions.some(
    (e: any) => e.type === "HOLIDAY" || e.type === "NO_CLASS" || e.type === "CANCELLED",
  );

  // 4. Batch query today's attendance sessions and records for this student
  const sessions = await (prisma as any).attendanceSession.findMany({
    where: {
      instituteId: ctx.instituteId,
      classGroupId: enrollment.classGroupId,
      date: { gte: startOfDay, lte: endOfDay },
    },
    include: {
      records: {
        where: { studentId },
        select: { status: true, checkInAt: true },
      },
    },
  });

  const sessionMap = new Map<string, any>();
  for (const s of sessions) {
    if (s.subjectId) sessionMap.set(s.subjectId, s);
  }

  return routines.map((r: any) => {
    let slotStatus = "NOT_MARKED_YET";
    if (isHoliday) {
      slotStatus = "HOLIDAY";
    } else {
      const matchedSession = r.subjectId ? sessionMap.get(r.subjectId) : null;
      if (matchedSession && matchedSession.records?.length > 0) {
        slotStatus = matchedSession.records[0].status;
      }
    }

    return {
      routineId: r.id,
      subject: r.subject?.name || "General Session",
      subjectCode: r.subject?.code,
      teacher: r.teacher?.user
        ? `${r.teacher.user.firstName} ${r.teacher.user.lastName}`
        : null,
      start: r.startTime,
      end: r.endTime,
      room: r.room,
      status: slotStatus,
    };
  });
};

/**
 * 2. Attendance History
 * Date-wise attendance logs with class, subject, and status.
 */
export const getAttendanceHistory = async (
  ctx: any,
  params: { from?: string; to?: string; subjectId?: string; cursor?: string; limit?: number },
) => {
  const studentId = await resolveStudentId(ctx);
  const limit = params.limit ? Math.min(params.limit, 100) : 50;

  const where: any = {
    studentId,
    ...(ctx.instituteId ? { instituteId: ctx.instituteId } : {}),
  };

  if (params.from || params.to || params.subjectId) {
    where.session = {};
    if (params.from) where.session.date = { ...(where.session.date || {}), gte: new Date(params.from) };
    if (params.to) where.session.date = { ...(where.session.date || {}), lte: new Date(params.to) };
    if (params.subjectId) where.session.subjectId = params.subjectId;
  }

  const records = await (prisma as any).attendanceRecord.findMany({
    where,
    take: limit,
    orderBy: { markedAt: "desc" },
    include: {
      session: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
          classGroup: { select: { id: true, name: true } },
        },
      },
    },
  });

  return records.map((rec: any) => ({
    id: rec.id,
    date: rec.session?.date,
    subject: rec.session?.subject?.name || "General",
    classGroup: rec.session?.classGroup?.name,
    status: rec.status,
    checkInAt: rec.checkInAt,
    checkOutAt: rec.checkOutAt,
    remarks: rec.remarks,
  }));
};

/**
 * 3. Attendance Calendar (Heatmap)
 * Per-day aggregated attendance status for calendar heatmap visualization.
 */
export const getAttendanceCalendar = async (ctx: any, params: { month?: string }) => {
  const studentId = await resolveStudentId(ctx);
  const now = new Date();
  const monthStr = params.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [yearStr, mStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const m = parseInt(mStr, 10) - 1;

  const startDate = new Date(year, m, 1, 0, 0, 0, 0);
  const endDate = new Date(year, m + 1, 0, 23, 59, 59, 999);

  const records = await (prisma as any).attendanceRecord.findMany({
    where: {
      studentId,
      session: {
        date: { gte: startDate, lte: endDate },
        ...(ctx.instituteId ? { instituteId: ctx.instituteId } : {}),
      },
    },
    include: {
      session: { select: { date: true } },
    },
    orderBy: { markedAt: "asc" },
  });

  // Group by day YYYY-MM-DD
  const dayMap = new Map<string, { total: number; present: number; late: number; absent: number; halfDay: number }>();
  for (const r of records) {
    if (!r.session?.date) continue;
    const dateKey = r.session.date.toISOString().slice(0, 10);
    const curr = dayMap.get(dateKey) || { total: 0, present: 0, late: 0, absent: 0, halfDay: 0 };
    curr.total++;
    if (r.status === "PRESENT") curr.present++;
    else if (r.status === "LATE") curr.late++;
    else if (r.status === "ABSENT") curr.absent++;
    else if (r.status === "HALF_DAY") curr.halfDay++;
    dayMap.set(dateKey, curr);
  }

  const days = Array.from(dayMap.entries()).map(([date, counts]) => {
    let dominantStatus = "PRESENT";
    if (counts.absent > 0) dominantStatus = "ABSENT";
    else if (counts.late > 0) dominantStatus = "LATE";
    else if (counts.halfDay > 0) dominantStatus = "HALF_DAY";

    return {
      date,
      dominantStatus,
      counts,
    };
  });

  return {
    month: monthStr,
    days,
  };
};

/**
 * 4. Subject Attendance Summary
 * Aggregated attendance with weighted % calculated using AttendancePolicy weights and belowThreshold boolean.
 */
export const getSubjectAttendanceSummary = async (ctx: any, params: { academicYearId?: string }) => {
  const studentId = await resolveStudentId(ctx);

  // 1. Fetch institute attendance policy
  const policy = await (prisma as any).attendancePolicy.findFirst({
    where: {
      instituteId: ctx.instituteId,
      status: "ACTIVE",
      ...(params.academicYearId ? { academicYearId: params.academicYearId } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  const presentWeight = Number(policy?.presentWeight ?? 1.0);
  const lateWeight = Number(policy?.lateWeight ?? 0.75);
  const halfDayWeight = Number(policy?.halfDayWeight ?? 0.5);
  const excusedWeight = Number(policy?.excusedWeight ?? 1.0);
  const minRequiredPercentage = Number(policy?.minRequiredPercentage ?? 75.0);

  // 2. Fetch all student attendance records for the year
  const records = await (prisma as any).attendanceRecord.findMany({
    where: {
      studentId,
      session: {
        ...(params.academicYearId ? { academicYearId: params.academicYearId } : {}),
        ...(ctx.instituteId ? { instituteId: ctx.instituteId } : {}),
      },
    },
    include: {
      session: {
        select: {
          subjectId: true,
          subject: { select: { id: true, name: true, code: true } },
        },
      },
    },
  });

  // 3. Aggregate by subject
  const subjectMap = new Map<string, any>();
  for (const r of records) {
    const sub = r.session?.subject;
    const subId = sub?.id || "general";
    const subName = sub?.name || "General Attendance";
    const subCode = sub?.code;

    const curr = subjectMap.get(subId) || {
      subjectId: subId,
      subjectName: subName,
      subjectCode: subCode,
      total: 0,
      present: 0,
      late: 0,
      absent: 0,
      halfDay: 0,
      excused: 0,
    };

    curr.total++;
    if (r.status === "PRESENT") curr.present++;
    else if (r.status === "LATE") curr.late++;
    else if (r.status === "ABSENT") curr.absent++;
    else if (r.status === "HALF_DAY") curr.halfDay++;
    else if (r.status === "EXCUSED") curr.excused++;

    subjectMap.set(subId, curr);
  }

  return Array.from(subjectMap.values()).map((s: any) => {
    const weightedPoints =
      s.present * presentWeight +
      s.late * lateWeight +
      s.halfDay * halfDayWeight +
      s.excused * excusedWeight;
    const weightedPercentage = s.total > 0 ? Number(((weightedPoints / s.total) * 100).toFixed(2)) : 0;
    const belowThreshold = weightedPercentage < minRequiredPercentage;

    return {
      ...s,
      weightedPercentage,
      minRequiredPercentage,
      belowThreshold,
    };
  });
};

/**
 * 5. Subject Progress
 * Per subject progress via Course.subjectId: completion %, lessonsDone/total, modulesDone/total, etc.
 */
export const getSubjectProgress = async (ctx: any) => {
  const studentId = await resolveStudentId(ctx);

  const enrollments = await (prisma as any).courseEnrollment.findMany({
    where: {
      studentId,
      status: "ACTIVE",
      ...(ctx.instituteId ? { instituteId: ctx.instituteId } : {}),
    },
    include: {
      course: {
        include: {
          subject: { select: { id: true, name: true, code: true } },
          modules: {
            where: { status: "ACTIVE" },
            include: {
              lessons: { where: { status: "ACTIVE" } },
              learningItems: { where: { status: "ACTIVE" } },
            },
          },
        },
      },
      moduleProgress: true,
      learningItemProgress: true,
    },
  });

  const lessonProgresses = await (prisma as any).lessonProgress.findMany({
    where: { studentId },
    select: { lessonId: true, isCompleted: true },
  });
  const completedLessonIds = new Set(
    lessonProgresses.filter((lp: any) => lp.isCompleted).map((lp: any) => lp.lessonId),
  );

  return enrollments.map((enr: any) => {
    const course = enr.course;
    const modules = course?.modules || [];

    const modulesTotal = modules.length;
    const completedModuleIds = new Set(
      enr.moduleProgress?.filter((mp: any) => mp.isCompleted).map((mp: any) => mp.moduleId) || [],
    );
    const modulesDone = modules.filter((m: any) => completedModuleIds.has(m.id)).length;

    let lessonsTotal = 0;
    let lessonsDone = 0;
    let quizzesTotal = 0;
    let quizzesDone = 0;
    let assignmentsTotal = 0;
    let assignmentsDone = 0;

    const completedItemIds = new Set(
      enr.learningItemProgress?.filter((lp: any) => lp.status === "COMPLETED").map((lp: any) => lp.learningItemId) || [],
    );

    for (const mod of modules) {
      const lessons = mod.lessons || [];
      lessonsTotal += lessons.length;
      lessonsDone += lessons.filter((l: any) => completedLessonIds.has(l.id)).length;

      const items = mod.learningItems || [];
      for (const item of items) {
        if (item.type === "QUIZ") {
          quizzesTotal++;
          if (completedItemIds.has(item.id)) quizzesDone++;
        } else if (item.type === "ASSIGNMENT") {
          assignmentsTotal++;
          if (completedItemIds.has(item.id)) assignmentsDone++;
        }
      }
    }

    return {
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      subjectId: course.subjectId,
      subjectName: course.subject?.name,
      completionPercentage: Number(enr.progressPercent || 0),
      lessonsDone,
      lessonsTotal,
      modulesDone,
      modulesTotal,
      quizzesDone,
      quizzesTotal,
      assignmentsDone,
      assignmentsTotal,
    };
  });
};

/**
 * 6. Overdue Items
 * Assessments/assignments/exams whose due/close time passed with no submission/result.
 */
export const getOverdueItems = async (ctx: any) => {
  const studentId = await resolveStudentId(ctx);
  const now = new Date();

  // Active courses for student
  const enrollments = await (prisma as any).courseEnrollment.findMany({
    where: { studentId, status: "ACTIVE" },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e: any) => e.courseId);

  if (courseIds.length === 0) return [];

  // Overdue assessments / assignments
  const overdueAssessments = await (prisma as any).assessment.findMany({
    where: {
      courseId: { in: courseIds },
      status: "PUBLISHED",
      OR: [{ dueAt: { lt: now } }, { closesAt: { lt: now } }],
    },
    include: {
      course: { select: { id: true, name: true, code: true } },
      results: { where: { studentId } },
    },
  });

  const overdueList: any[] = [];

  for (const a of overdueAssessments) {
    const hasSubmitted = a.results && a.results.length > 0 && a.results[0].status !== "DRAFT";
    if (!hasSubmitted) {
      const dueDate = a.dueAt || a.closesAt;
      const daysOverdue = dueDate
        ? Math.max(1, Math.floor((now.getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;

      overdueList.push({
        id: a.id,
        title: a.title,
        type: a.type,
        courseId: a.courseId,
        courseName: a.course?.name,
        dueDate,
        daysOverdue,
      });
    }
  }

  // Overdue exams
  const overdueExams = await (prisma as any).exam.findMany({
    where: {
      courseId: { in: courseIds },
      status: "PUBLISHED",
      endDate: { lt: now },
      marks: { none: { studentId } },
    },
    include: {
      course: { select: { id: true, name: true, code: true } },
    },
  });

  for (const e of overdueExams) {
    const daysOverdue = e.endDate
      ? Math.max(1, Math.floor((now.getTime() - new Date(e.endDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    overdueList.push({
      id: e.id,
      title: e.name,
      type: "EXAM",
      courseId: e.courseId,
      courseName: e.course?.name,
      dueDate: e.endDate,
      daysOverdue,
    });
  }

  return overdueList.sort((a, b) => b.daysOverdue - a.daysOverdue);
};

/**
 * 7. Upcoming Items
 * Exams, quizzes, assignments, and live classes sorted by time with countdown.
 */
export const getUpcomingItems = async (ctx: any, params: { days?: number }) => {
  const studentId = await resolveStudentId(ctx);
  const days = params.days ? Number(params.days) : 14;
  const now = new Date();
  const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const enrollments = await (prisma as any).courseEnrollment.findMany({
    where: { studentId, status: "ACTIVE" },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e: any) => e.courseId);

  if (courseIds.length === 0) return [];

  const [assessments, exams, liveClasses] = await Promise.all([
    (prisma as any).assessment.findMany({
      where: {
        courseId: { in: courseIds },
        status: "PUBLISHED",
        OR: [
          { dueAt: { gte: now, lte: targetDate } },
          { opensAt: { gte: now, lte: targetDate } },
        ],
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
    }),
    (prisma as any).exam.findMany({
      where: {
        courseId: { in: courseIds },
        status: "PUBLISHED",
        startDate: { gte: now, lte: targetDate },
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
    }),
    (prisma as any).liveClass.findMany({
      where: {
        courseId: { in: courseIds },
        status: "ACTIVE",
        scheduledStart: { gte: now, lte: targetDate },
      },
      include: {
        course: { select: { id: true, name: true, code: true } },
      },
    }),
  ]);

  const upcoming: any[] = [];

  for (const a of assessments) {
    const eventTime = a.dueAt || a.opensAt;
    const diffMs = eventTime.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const countdown = hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;

    upcoming.push({
      id: a.id,
      title: a.title,
      type: a.type,
      courseName: a.course?.name,
      scheduledTime: eventTime,
      countdown,
    });
  }

  for (const e of exams) {
    const diffMs = e.startDate.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const countdown = hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;

    upcoming.push({
      id: e.id,
      title: e.name,
      type: "EXAM",
      courseName: e.course?.name,
      scheduledTime: e.startDate,
      countdown,
    });
  }

  for (const lc of liveClasses) {
    const diffMs = lc.scheduledStart.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const countdown = hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;

    upcoming.push({
      id: lc.id,
      title: lc.title,
      type: "LIVE_CLASS",
      courseName: lc.course?.name,
      scheduledTime: lc.scheduledStart,
      meetingUrl: lc.meetingUrl,
      countdown,
    });
  }

  return upcoming.sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
  );
};

/**
 * 8. Continue Learning
 * Last in-progress learning item + lastPositionSec.
 */
export const getContinueLearning = async (ctx: any) => {
  const studentId = await resolveStudentId(ctx);

  // 1. Try LearningItemProgress
  const itemProgress = await (prisma as any).learningItemProgress.findFirst({
    where: {
      enrollment: { studentId },
      status: { in: ["IN_PROGRESS", "NOT_STARTED"] },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      learningItem: {
        include: {
          lesson: { select: { id: true, title: true, type: true } },
          module: {
            include: {
              course: { select: { id: true, name: true, code: true, thumbnailUrl: true } },
            },
          },
        },
      },
    },
  });

  if (itemProgress) {
    return {
      learningItemId: itemProgress.learningItemId,
      title: itemProgress.learningItem?.title,
      type: itemProgress.learningItem?.type,
      lessonId: itemProgress.learningItem?.lesson?.id,
      lessonTitle: itemProgress.learningItem?.lesson?.title,
      moduleId: itemProgress.learningItem?.moduleId,
      courseId: itemProgress.learningItem?.module?.courseId,
      courseName: itemProgress.learningItem?.module?.course?.name,
      thumbnailUrl: itemProgress.learningItem?.module?.course?.thumbnailUrl,
      lastPositionSec: itemProgress.lastPositionSec || 0,
      progressPercent: Number(itemProgress.progressPercent || 0),
    };
  }

  // 2. Fall back to LessonProgress
  const lessonProg = await (prisma as any).lessonProgress.findFirst({
    where: { studentId, isCompleted: false },
    orderBy: { lastAccessedAt: "desc" },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: { select: { id: true, name: true, code: true, thumbnailUrl: true } },
            },
          },
        },
      },
    },
  });

  if (lessonProg) {
    return {
      lessonId: lessonProg.lessonId,
      lessonTitle: lessonProg.lesson?.title,
      type: lessonProg.lesson?.type,
      moduleId: lessonProg.lesson?.moduleId,
      courseId: lessonProg.lesson?.module?.courseId,
      courseName: lessonProg.lesson?.module?.course?.name,
      thumbnailUrl: lessonProg.lesson?.module?.course?.thumbnailUrl,
      lastPositionSec: lessonProg.lastPositionSec || 0,
      progressPercent: Number(lessonProg.progressPercent || 0),
    };
  }

  return null;
};

/**
 * 9. Performance Trend
 * Exam and assessment scores over time.
 */
export const getPerformanceTrend = async (ctx: any) => {
  const studentId = await resolveStudentId(ctx);

  const [examMarks, assessmentResults] = await Promise.all([
    (prisma as any).examMark.findMany({
      where: { studentId, status: "APPROVED" },
      include: {
        exam: { select: { id: true, name: true } },
        examComponent: { select: { name: true, maxMarks: true } },
      },
      orderBy: { enteredAt: "asc" },
      take: 20,
    }),
    (prisma as any).assessmentResult.findMany({
      where: { studentId, status: { in: ["PUBLISHED", "EVALUATED"] } },
      include: {
        assessment: { select: { id: true, title: true, maxMarks: true } },
      },
      orderBy: { evaluatedAt: "asc" },
      take: 20,
    }),
  ]);

  const points: any[] = [];

  for (const m of examMarks) {
    const max = Number(m.examComponent?.maxMarks || 100);
    const score = Number(m.marks);
    const percentage = max > 0 ? Number(((score / max) * 100).toFixed(2)) : 0;

    points.push({
      date: m.approvedAt || m.enteredAt,
      title: `${m.exam?.name} (${m.examComponent?.name})`,
      type: "EXAM",
      score,
      maxMarks: max,
      percentage,
    });
  }

  for (const ar of assessmentResults) {
    const max = Number(ar.assessment?.maxMarks || 100);
    const score = Number(ar.marks);
    const percentage = ar.percentage ? Number(ar.percentage) : max > 0 ? Number(((score / max) * 100).toFixed(2)) : 0;

    points.push({
      date: ar.evaluatedAt || ar.submittedAt,
      title: ar.assessment?.title,
      type: "ASSESSMENT",
      score,
      maxMarks: max,
      percentage,
    });
  }

  return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * 10. Study Activity
 * Watched seconds per week from LessonProgress.
 */
export const getStudyActivity = async (ctx: any, params: { weeks?: number }) => {
  const studentId = await resolveStudentId(ctx);
  const weeksCount = params.weeks ? Number(params.weeks) : 4;
  const now = new Date();

  // Aggregate watched seconds
  const lessonProgresses = await (prisma as any).lessonProgress.findMany({
    where: { studentId },
    select: { watchedSeconds: true, lastAccessedAt: true },
  });

  const weeks: any[] = [];
  for (let i = 0; i < weeksCount; i++) {
    const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

    const seconds = lessonProgresses
      .filter((lp: any) => lp.lastAccessedAt && lp.lastAccessedAt >= weekStart && lp.lastAccessedAt < weekEnd)
      .reduce((sum: number, lp: any) => sum + (lp.watchedSeconds || 0), 0);

    weeks.push({
      week: i + 1,
      label: `Week ${i + 1}`,
      startDate: weekStart.toISOString().slice(0, 10),
      endDate: weekEnd.toISOString().slice(0, 10),
      watchedSeconds: seconds,
      watchedHours: Number((seconds / 3600).toFixed(2)),
    });
  }

  return weeks.reverse();
};

/**
 * 11. Student Dashboard Aggregator
 * Composes all metrics in ONE call using Promise.all, cached 60s in Redis.
 */
export const getStudentDashboard = async (ctx: any) => {
  const studentId = await resolveStudentId(ctx);
  const cacheKey = `student-dash:${studentId}`;

  // Check Redis cache first
  const cached = await cacheHelper.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Compose in ONE call via Promise.all
  const [
    todaySummary,
    attendanceSummary,
    subjectProgress,
    overdueItems,
    upcomingItems,
    continueLearning,
    performanceTrend,
    studyActivity,
  ] = await Promise.all([
    getTodaySummary(ctx),
    getSubjectAttendanceSummary(ctx, {}),
    getSubjectProgress(ctx),
    getOverdueItems(ctx),
    getUpcomingItems(ctx, { days: 14 }),
    getContinueLearning(ctx),
    getPerformanceTrend(ctx),
    getStudyActivity(ctx, { weeks: 4 }),
  ]);

  const dashboard = {
    studentId,
    cachedAt: new Date().toISOString(),
    todaySummary,
    attendanceSummary,
    subjectProgress,
    overdueItems,
    upcomingItems,
    continueLearning,
    performanceTrend,
    studyActivity,
  };

  // Cache 60s in Redis
  await cacheHelper.set(cacheKey, dashboard, 60);

  return dashboard;
};

export const StudentPortalService = {
  resolveStudentId,
  getTodaySummary,
  getAttendanceHistory,
  getAttendanceCalendar,
  getSubjectAttendanceSummary,
  getSubjectProgress,
  getOverdueItems,
  getUpcomingItems,
  getContinueLearning,
  getPerformanceTrend,
  getStudyActivity,
  getStudentDashboard,
};

export default StudentPortalService;
