import { describe, it, expect, beforeEach, vi } from "vitest";
import {
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
} from "./student-portal.service.js";
import prisma from "../../config/prisma.js";
import cacheHelper from "../../utils/cache.js";

vi.mock("../../config/prisma.js", () => ({
  default: {
    student: {
      findFirst: vi.fn(),
    },
    studentAcademicEnrollment: {
      findFirst: vi.fn(),
    },
    classRoutine: {
      findMany: vi.fn(),
    },
    attendanceCalendarException: {
      findMany: vi.fn(),
    },
    attendanceSession: {
      findMany: vi.fn(),
    },
    attendanceRecord: {
      findMany: vi.fn(),
    },
    attendancePolicy: {
      findFirst: vi.fn(),
    },
    courseEnrollment: {
      findMany: vi.fn(),
    },
    lessonProgress: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    learningItemProgress: {
      findFirst: vi.fn(),
    },
    assessment: {
      findMany: vi.fn(),
    },
    exam: {
      findMany: vi.fn(),
    },
    examMark: {
      findMany: vi.fn(),
    },
    assessmentResult: {
      findMany: vi.fn(),
    },
    liveClass: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../utils/cache.js", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
  },
}));

describe("Step 7 - Student Portal Dashboard", () => {
  const studentId = "stu-1111-1111-1111-111111111111";
  const userId = "user-2222-2222-2222-222222222222";
  const instituteId = "inst-3333-3333-3333-333333333333";
  const classGroupId = "cg-4444-4444-4444-444444444444";
  const sectionId = "sec-5555-5555-5555-555555555555";
  const courseId = "course-6666-6666-6666-666666666666";
  const subjectId = "sub-7777-7777-7777-777777777777";

  let mockCtx: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockCtx = {
      userId,
      studentId,
      instituteId,
      isPlatformAdmin: false,
    };

    (prisma.student.findFirst as any).mockResolvedValue({
      id: studentId,
      userId,
      instituteId,
    });
  });

  // =========================================================================
  // 1. resolveStudentId & Scoping
  // =========================================================================
  describe("resolveStudentId & Auth Context Scoping", () => {
    it("returns ctx.studentId directly if already populated on ctx", async () => {
      const result = await resolveStudentId(mockCtx);
      expect(result).toBe(studentId);
      expect(prisma.student.findFirst).not.toHaveBeenCalled();
    });

    it("resolves studentId from userId and instituteId if not on ctx", async () => {
      const ctxWithoutStudentId = { userId, instituteId };
      const result = await resolveStudentId(ctxWithoutStudentId);

      expect(result).toBe(studentId);
      expect(prisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, instituteId },
        }),
      );
    });

    it("throws 403 FORBIDDEN if user has no student profile", async () => {
      (prisma.student.findFirst as any).mockResolvedValue(null);
      await expect(resolveStudentId({ userId: "unknown-user", instituteId })).rejects.toThrow(
        "Student profile not found",
      );
    });
  });

  // =========================================================================
  // 2. getTodaySummary (Acceptance: under 6 queries)
  // =========================================================================
  describe("getTodaySummary", () => {
    it("retrieves today's routine with attendance status under 6 queries", async () => {
      // Query 1: Academic Enrollment
      (prisma.studentAcademicEnrollment.findFirst as any).mockResolvedValue({
        classGroupId,
        sectionId,
        academicYearId: "year-1",
      });

      // Query 2: Class Routines
      (prisma.classRoutine.findMany as any).mockResolvedValue([
        {
          id: "routine-1",
          startTime: new Date("2026-10-15T09:00:00Z"),
          endTime: new Date("2026-10-15T10:00:00Z"),
          room: "Room 101",
          subjectId,
          subject: { id: subjectId, name: "Physics", code: "PHY101" },
          teacher: { user: { firstName: "Albert", lastName: "Einstein" } },
        },
        {
          id: "routine-2",
          startTime: new Date("2026-10-15T10:15:00Z"),
          endTime: new Date("2026-10-15T11:15:00Z"),
          room: "Room 102",
          subjectId: "sub-8888",
          subject: { id: "sub-8888", name: "Chemistry", code: "CHEM101" },
          teacher: { user: { firstName: "Marie", lastName: "Curie" } },
        },
      ]);

      // Query 3: Calendar Exceptions
      (prisma.attendanceCalendarException.findMany as any).mockResolvedValue([]);

      // Query 4: Today's Attendance Sessions
      (prisma.attendanceSession.findMany as any).mockResolvedValue([
        {
          id: "session-1",
          subjectId,
          records: [{ status: "PRESENT", checkInAt: new Date("2026-10-15T09:02:00Z") }],
        },
      ]);

      const summary = await getTodaySummary(mockCtx);

      expect(summary.length).toBe(2);
      expect(summary[0].subject).toBe("Physics");
      expect(summary[0].teacher).toBe("Albert Einstein");
      expect(summary[0].status).toBe("PRESENT");

      // Second routine has no recorded session today -> NOT_MARKED_YET
      expect(summary[1].subject).toBe("Chemistry");
      expect(summary[1].status).toBe("NOT_MARKED_YET");

      // Verify query count requirement: total 4 queries <= 6 queries
      expect(prisma.studentAcademicEnrollment.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.classRoutine.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.attendanceCalendarException.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.attendanceSession.findMany).toHaveBeenCalledTimes(1);
    });

    it("marks slots as HOLIDAY when calendar exception exists", async () => {
      (prisma.studentAcademicEnrollment.findFirst as any).mockResolvedValue({
        classGroupId,
        sectionId,
      });
      (prisma.classRoutine.findMany as any).mockResolvedValue([
        { id: "r1", subjectId, startTime: new Date(), endTime: new Date() },
      ]);
      (prisma.attendanceCalendarException.findMany as any).mockResolvedValue([
        { type: "HOLIDAY", reason: "National Holiday" },
      ]);
      (prisma.attendanceSession.findMany as any).mockResolvedValue([]);

      const summary = await getTodaySummary(mockCtx);
      expect(summary[0].status).toBe("HOLIDAY");
    });
  });

  // =========================================================================
  // 3. getAttendanceHistory & getAttendanceCalendar
  // =========================================================================
  describe("getAttendanceHistory & Calendar Heatmap", () => {
    it("getAttendanceHistory scopes strictly by studentId and returns rows", async () => {
      (prisma.attendanceRecord.findMany as any).mockResolvedValue([
        {
          id: "rec-1",
          status: "PRESENT",
          checkInAt: new Date("2026-10-10T09:00:00Z"),
          session: {
            date: new Date("2026-10-10"),
            subject: { name: "Mathematics" },
            classGroup: { name: "Grade 10" },
          },
        },
      ]);

      const history = await getAttendanceHistory(mockCtx, { from: "2026-10-01T00:00:00Z" });

      expect(history.length).toBe(1);
      expect(history[0].subject).toBe("Mathematics");
      expect(history[0].status).toBe("PRESENT");
      expect(prisma.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ studentId }),
        }),
      );
    });

    it("getAttendanceCalendar groups per-day attendance status for heatmap", async () => {
      (prisma.attendanceRecord.findMany as any).mockResolvedValue([
        {
          status: "PRESENT",
          session: { date: new Date("2026-10-05T00:00:00Z") },
        },
        {
          status: "ABSENT",
          session: { date: new Date("2026-10-06T00:00:00Z") },
        },
      ]);

      const calendar = await getAttendanceCalendar(mockCtx, { month: "2026-10" });

      expect(calendar.month).toBe("2026-10");
      expect(calendar.days.length).toBe(2);
      expect(calendar.days.find((d: any) => d.date === "2026-10-05")?.dominantStatus).toBe("PRESENT");
      expect(calendar.days.find((d: any) => d.date === "2026-10-06")?.dominantStatus).toBe("ABSENT");
    });
  });

  // =========================================================================
  // 4. getSubjectAttendanceSummary
  // =========================================================================
  describe("getSubjectAttendanceSummary", () => {
    it("calculates weighted percentage using AttendancePolicy and flags belowThreshold", async () => {
      // Policy: minRequired = 75%, present = 1.0, late = 0.5
      (prisma.attendancePolicy.findFirst as any).mockResolvedValue({
        minRequiredPercentage: 75.0,
        presentWeight: 1.0,
        lateWeight: 0.5,
        halfDayWeight: 0.5,
        excusedWeight: 1.0,
      });

      // Student has 10 sessions in Physics: 6 Present, 2 Late, 2 Absent -> (6*1 + 2*0.5 + 0)/10 = 70% < 75%
      (prisma.attendanceRecord.findMany as any).mockResolvedValue([
        ...Array(6).fill({ status: "PRESENT", session: { subject: { id: "phy", name: "Physics" } } }),
        ...Array(2).fill({ status: "LATE", session: { subject: { id: "phy", name: "Physics" } } }),
        ...Array(2).fill({ status: "ABSENT", session: { subject: { id: "phy", name: "Physics" } } }),
      ]);

      const summary = await getSubjectAttendanceSummary(mockCtx, {});

      expect(summary.length).toBe(1);
      expect(summary[0].subjectName).toBe("Physics");
      expect(summary[0].total).toBe(10);
      expect(summary[0].present).toBe(6);
      expect(summary[0].late).toBe(2);
      expect(summary[0].absent).toBe(2);
      expect(summary[0].weightedPercentage).toBe(70.0);
      expect(summary[0].belowThreshold).toBe(true); // 70% < 75%
    });
  });

  // =========================================================================
  // 5. getSubjectProgress
  // =========================================================================
  describe("getSubjectProgress", () => {
    it("computes completion %, lessonsDone, modulesDone, quizzesDone per subject", async () => {
      (prisma.courseEnrollment.findMany as any).mockResolvedValue([
        {
          id: "enr-1",
          progressPercent: 65.5,
          course: {
            id: courseId,
            name: "Physics I",
            subjectId,
            subject: { name: "Physics" },
            modules: [
              {
                id: "m1",
                lessons: [{ id: "l1" }, { id: "l2" }],
                learningItems: [{ id: "li1", type: "QUIZ" }, { id: "li2", type: "ASSIGNMENT" }],
              },
            ],
          },
          moduleProgress: [{ moduleId: "m1", isCompleted: true }],
          learningItemProgress: [
            { learningItemId: "li1", status: "COMPLETED" },
          ],
        },
      ]);

      (prisma.lessonProgress.findMany as any).mockResolvedValue([
        { lessonId: "l1", isCompleted: true },
      ]);

      const progress = await getSubjectProgress(mockCtx);

      expect(progress.length).toBe(1);
      expect(progress[0].courseName).toBe("Physics I");
      expect(progress[0].lessonsTotal).toBe(2);
      expect(progress[0].lessonsDone).toBe(1);
      expect(progress[0].modulesTotal).toBe(1);
      expect(progress[0].modulesDone).toBe(1);
      expect(progress[0].quizzesTotal).toBe(1);
      expect(progress[0].quizzesDone).toBe(1);
      expect(progress[0].assignmentsTotal).toBe(1);
      expect(progress[0].assignmentsDone).toBe(0);
      expect(progress[0].completionPercentage).toBe(65.5);
    });
  });

  // =========================================================================
  // 6. getOverdueItems & getUpcomingItems
  // =========================================================================
  describe("getOverdueItems & getUpcomingItems", () => {
    it("getOverdueItems returns items past due with no student submission", async () => {
      (prisma.courseEnrollment.findMany as any).mockResolvedValue([{ courseId }]);

      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago

      (prisma.assessment.findMany as any).mockResolvedValue([
        {
          id: "asm-1",
          title: "Mechanics Homework",
          type: "ASSIGNMENT",
          courseId,
          course: { name: "Physics I" },
          dueAt: pastDate,
          results: [], // no student submission
        },
      ]);
      (prisma.exam.findMany as any).mockResolvedValue([]);

      const overdue = await getOverdueItems(mockCtx);

      expect(overdue.length).toBe(1);
      expect(overdue[0].title).toBe("Mechanics Homework");
      expect(overdue[0].daysOverdue).toBe(3);
    });

    it("getUpcomingItems returns sorted events with human countdown", async () => {
      (prisma.courseEnrollment.findMany as any).mockResolvedValue([{ courseId }]);

      const upcomingExamDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000); // 2d 4h

      (prisma.assessment.findMany as any).mockResolvedValue([]);
      (prisma.exam.findMany as any).mockResolvedValue([
        {
          id: "exam-1",
          name: "Midterm Physics",
          course: { name: "Physics I" },
          startDate: upcomingExamDate,
        },
      ]);
      (prisma.liveClass.findMany as any).mockResolvedValue([]);

      const upcoming = await getUpcomingItems(mockCtx, { days: 7 });

      expect(upcoming.length).toBe(1);
      expect(upcoming[0].title).toBe("Midterm Physics");
      expect(upcoming[0].type).toBe("EXAM");
      expect(upcoming[0].countdown).toMatch(/2d 4h|2d 3h/);
    });
  });

  // =========================================================================
  // 7. getContinueLearning, PerformanceTrend, StudyActivity
  // =========================================================================
  describe("ContinueLearning, PerformanceTrend, StudyActivity", () => {
    it("getContinueLearning returns last in-progress learning item with lastPositionSec", async () => {
      (prisma.learningItemProgress.findFirst as any).mockResolvedValue({
        learningItemId: "item-101",
        lastPositionSec: 345,
        progressPercent: 45.0,
        learningItem: {
          title: "Electromagnetism Lecture 3",
          type: "VIDEO",
          lesson: { id: "les-1", title: "Maxwell Equations" },
          module: { courseId, course: { name: "Physics II", thumbnailUrl: "thumb.jpg" } },
        },
      });

      const res = await getContinueLearning(mockCtx);

      expect(res?.title).toBe("Electromagnetism Lecture 3");
      expect(res?.lastPositionSec).toBe(345);
      expect(res?.courseName).toBe("Physics II");
    });

    it("getPerformanceTrend aggregates exam and assessment scores chronologically", async () => {
      (prisma.examMark.findMany as any).mockResolvedValue([
        {
          enteredAt: new Date("2026-09-01"),
          marks: 85,
          exam: { name: "Term 1 Exam" },
          examComponent: { name: "Written", maxMarks: 100 },
        },
      ]);
      (prisma.assessmentResult.findMany as any).mockResolvedValue([
        {
          evaluatedAt: new Date("2026-09-15"),
          marks: 18,
          percentage: 90,
          assessment: { title: "Quiz 1", maxMarks: 20 },
        },
      ]);

      const trend = await getPerformanceTrend(mockCtx);

      expect(trend.length).toBe(2);
      expect(trend[0].title).toContain("Term 1 Exam");
      expect(trend[0].percentage).toBe(85);
      expect(trend[1].title).toBe("Quiz 1");
      expect(trend[1].percentage).toBe(90);
    });

    it("getStudyActivity aggregates watched seconds across weeks", async () => {
      const now = new Date();
      (prisma.lessonProgress.findMany as any).mockResolvedValue([
        { watchedSeconds: 3600, lastAccessedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
      ]);

      const activity = await getStudyActivity(mockCtx, { weeks: 2 });

      expect(activity.length).toBe(2);
      expect(activity[1].watchedSeconds).toBe(3600);
      expect(activity[1].watchedHours).toBe(1.0);
    });
  });

  // =========================================================================
  // 8. getStudentDashboard (Composed in ONE call, cached 60s in Redis)
  // =========================================================================
  describe("getStudentDashboard Aggregator & Redis Caching", () => {
    it("returns cached dashboard if available in Redis without executing DB queries", async () => {
      const cachedDashboard = {
        studentId,
        cachedAt: "2026-10-15T12:00:00Z",
        todaySummary: [],
        subjectProgress: [],
      };

      (cacheHelper.get as any).mockResolvedValue(cachedDashboard);

      const result = await getStudentDashboard(mockCtx);

      expect(result).toEqual(cachedDashboard);
      expect(cacheHelper.get).toHaveBeenCalledWith(`student-dash:${studentId}`);
      // Zero DB calls executed because of cache hit
      expect(prisma.studentAcademicEnrollment.findFirst).not.toHaveBeenCalled();
    });

    it("composes all sections in ONE parallel call and caches 60s in Redis on cache miss", async () => {
      (cacheHelper.get as any).mockResolvedValue(null);

      (prisma.studentAcademicEnrollment.findFirst as any).mockResolvedValue(null);
      (prisma.attendancePolicy.findFirst as any).mockResolvedValue(null);
      (prisma.attendanceRecord.findMany as any).mockResolvedValue([]);
      (prisma.courseEnrollment.findMany as any).mockResolvedValue([]);
      (prisma.lessonProgress.findMany as any).mockResolvedValue([]);
      (prisma.learningItemProgress.findFirst as any).mockResolvedValue(null);
      (prisma.examMark.findMany as any).mockResolvedValue([]);
      (prisma.assessmentResult.findMany as any).mockResolvedValue([]);

      const result: any = await getStudentDashboard(mockCtx);

      expect(result.studentId).toBe(studentId);
      expect(result.todaySummary).toBeDefined();
      expect(result.attendanceSummary).toBeDefined();
      expect(result.subjectProgress).toBeDefined();
      expect(result.overdueItems).toBeDefined();
      expect(result.upcomingItems).toBeDefined();
      expect(result.performanceTrend).toBeDefined();
      expect(result.studyActivity).toBeDefined();

      // Verified 60s Redis caching
      expect(cacheHelper.set).toHaveBeenCalledWith(
        `student-dash:${studentId}`,
        expect.objectContaining({ studentId }),
        60,
      );
    });
  });
});
