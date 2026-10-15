import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "../../config/prisma.js";
import cacheHelper from "../../utils/cache.js";
import TeacherDashboardService, {
  getTeacherDashboard,
  getTodayClasses,
  getPendingAttendance,
  getPendingGrading,
  getClassAttendanceStats,
  getAssignmentSubmissionRate,
  getQuizPerformance,
  getCourseCompletionFunnel,
  getAtRiskStudents,
} from "./teacher-dashboard.service.js";
import AdminDashboardService, {
  getAdminDashboard,
  getEnrollmentTrend,
  getAttendanceRate,
  getResultPassRate,
  getLmsEngagement,
  getTeacherWorkload,
  getSupportStats,
} from "./admin-dashboard.service.js";
import GuardianDashboardService, {
  getGuardianDashboard,
  listChildren,
  getChildAttendance,
  getChildResults,
  getChildNotices,
} from "./guardian-dashboard.service.js";

vi.mock("../../config/prisma.js", () => ({
  default: {
    teacherProfile: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    guardian: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    classRoutine: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    attendanceSession: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    attendanceRecord: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
    },
    liveClass: {
      findMany: vi.fn(),
    },
    assignment: {
      findMany: vi.fn(),
    },
    assignmentSubmission: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    exam: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    examMark: {
      findMany: vi.fn(),
    },
    assessmentResult: {
      findMany: vi.fn(),
    },
    course: {
      count: vi.fn(),
    },
    courseEnrollment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    studentAcademicEnrollment: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    studentResult: {
      findMany: vi.fn(),
    },
    learningItemProgress: {
      count: vi.fn(),
    },
    supportTicket: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    supportSession: {
      count: vi.fn(),
    },
    notice: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../../utils/cache.js", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    delByPattern: vi.fn(),
  },
}));

describe("Step 10 - Role Dashboards", () => {
  const instituteId = "11111111-1111-1111-1111-111111111111";
  const teacherUserId = "22222222-2222-2222-2222-222222222222";
  const teacherId = "33333333-3333-3333-3333-333333333333";
  const guardianUserId = "44444444-4444-4444-4444-444444444444";
  const guardianId = "55555555-5555-5555-5555-555555555555";
  const childId1 = "66666666-6666-6666-6666-666666666666";
  const childId2 = "77777777-7777-7777-7777-777777777777";
  const classGroupId = "88888888-8888-8888-8888-888888888888";
  const courseId = "99999999-9999-9999-9999-999999999999";

  const teacherCtx = {
    userId: teacherUserId,
    instituteId,
    roles: ["TEACHER"],
  };

  const adminCtx = {
    userId: "admin-user",
    instituteId,
    roles: ["INSTITUTE_ADMIN"],
  };

  const guardianCtx = {
    userId: guardianUserId,
    instituteId,
    roles: ["GUARDIAN"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // SECTION 1: TEACHER DASHBOARD TESTS
  // ==========================================
  describe("Teacher Dashboard (scope ASSIGNED)", () => {
    const mockTeacherProfile = {
      id: teacherId,
      userId: teacherUserId,
      instituteId,
      employeeCode: "TCH-001",
      courseAssignments: [{ courseId }],
      classAssignments: [{ classGroupId }],
      classRoutines: [
        {
          id: "routine-1",
          classGroupId,
          sectionId: "sec-1",
          subjectId: "sub-1",
          courseId,
        },
      ],
    };

    beforeEach(() => {
      (prisma.teacherProfile.findFirst as any).mockResolvedValue(mockTeacherProfile);
    });

    it("1. getTodayClasses returns scheduled routines, attendance status and live classes", async () => {
      (prisma.classRoutine.findMany as any).mockResolvedValue([
        {
          id: "routine-1",
          classGroupId,
          sectionId: "sec-1",
          subjectId: "sub-1",
          startTime: new Date(),
          endTime: new Date(),
          classGroup: { name: "Class 10" },
          section: { name: "A" },
          subject: { name: "Advanced Physics", code: "PHY-101" },
        },
      ]);

      (prisma.attendanceSession.findMany as any).mockResolvedValue([
        {
          id: "session-1",
          classGroupId,
          sectionId: "sec-1",
          subjectId: "sub-1",
          status: "COMPLETED",
        },
      ]);

      (prisma.liveClass.findMany as any).mockResolvedValue([]);

      const result = await getTodayClasses(teacherCtx);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].subject).toBe("Advanced Physics");
      expect(result.items[0].attendanceStatus).toBe("COMPLETED");
      expect(result.kpis[0].title).toBe("Today's Classes");
      expect(result.kpis[0].value).toBe(1);
    });

    it("2. getPendingAttendance returns uncompleted sessions in the past", async () => {
      (prisma.attendanceSession.findMany as any).mockResolvedValue([
        {
          id: "session-pending",
          date: new Date(),
          status: "SCHEDULED",
          classGroup: { name: "Class 10" },
          section: { name: "A" },
          subject: { name: "Physics" },
        },
      ]);

      const result = await getPendingAttendance(teacherCtx);

      expect(result.items).toHaveLength(1);
      expect(result.kpis[0].value).toBe(1);
      expect(result.items[0].status).toBe("SCHEDULED");
    });

    it("3. getPendingGrading returns assignment submissions and draft exam marks", async () => {
      (prisma.assignmentSubmission.findMany as any).mockResolvedValue([
        {
          id: "sub-1",
          submittedAt: new Date(),
          assignment: { title: "Mechanics Homework" },
          student: { firstName: "John", lastName: "Doe", studentCode: "STU-001" },
        },
      ]);

      (prisma.examMark.findMany as any).mockResolvedValue([
        {
          id: "mark-1",
          enteredAt: new Date(),
          exam: { name: "Midterm Physics Exam" },
          student: { firstName: "Alice", lastName: "Smith", studentCode: "STU-002" },
        },
      ]);

      const result = await getPendingGrading(teacherCtx);

      expect(result.items).toHaveLength(2);
      expect(result.kpis[0].value).toBe(2);
      expect(result.items[0].type).toBe("ASSIGNMENT");
      expect(result.items[1].type).toBe("EXAM_MARK");
    });

    it("4. getClassAttendanceStats returns chart-ready array and attendance rate", async () => {
      (prisma.attendanceRecord.groupBy as any).mockResolvedValue([
        { status: "PRESENT", _count: { id: 80 } },
        { status: "ABSENT", _count: { id: 10 } },
        { status: "LATE", _count: { id: 10 } },
      ]);

      const result = await getClassAttendanceStats(teacherCtx);

      expect(result.chart).toBeDefined();
      expect(result.chart).toHaveLength(4);
      expect(result.chart.find((c) => c.label === "Present")?.value).toBe(80);
      expect(result.chart.find((c) => c.label === "Absent")?.value).toBe(10);
      expect(result.kpis[0].value).toBeGreaterThan(80); // weighted late
    });

    it("5. getAssignmentSubmissionRate computes submitted, missing, and graded", async () => {
      (prisma.courseEnrollment.count as any).mockResolvedValue(50); // expected
      (prisma.assignmentSubmission.count as any)
        .mockResolvedValueOnce(40) // submitted
        .mockResolvedValueOnce(30); // graded

      const result = await getAssignmentSubmissionRate(teacherCtx);

      expect(result.chart).toEqual([
        { label: "Submitted", value: 40 },
        { label: "Missing", value: 10 },
        { label: "Graded", value: 30 },
      ]);
      expect(result.kpis[0].value).toBe(80); // 40/50 * 100%
    });

    it("6. getQuizPerformance returns score distribution buckets", async () => {
      (prisma.assessmentResult.findMany as any).mockResolvedValue([
        { percentage: 95 },
        { percentage: 82 },
        { percentage: 65 },
        { percentage: 45 },
      ]);

      const result = await getQuizPerformance(teacherCtx);

      expect(result.chart).toHaveLength(4);
      expect(result.chart[0].label).toContain("90-100%");
      expect(result.chart[0].value).toBe(1);
      expect(result.chart[3].label).toContain("<50%");
      expect(result.chart[3].value).toBe(1);
    });

    it("7. getCourseCompletionFunnel returns 4-stage funnel", async () => {
      (prisma.courseEnrollment.findMany as any).mockResolvedValue([
        { progressPercent: 10, status: "ACTIVE" },
        { progressPercent: 60, status: "ACTIVE" },
        { progressPercent: 100, status: "COMPLETED" },
        { progressPercent: 0, status: "ENROLLED" },
      ]);

      const result = await getCourseCompletionFunnel(teacherCtx);

      expect(result.chart).toEqual([
        { label: "Enrolled", value: 4 },
        { label: "Started Learning", value: 3 },
        { label: "Halfway (>50%)", value: 2 },
        { label: "Completed", value: 1 },
      ]);
      expect(result.kpis[0].value).toBe(25); // 1/4 * 100%
    });

    it("8. getAtRiskStudents identifies students based on 3 rules: attendance, overdue items, inactivity", async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

      (prisma.assignment.findMany as any).mockResolvedValue([
        { id: "overdue-1" },
        { id: "overdue-2" },
      ]);

      (prisma.student.findMany as any).mockResolvedValue([
        {
          id: "student-at-risk-1",
          firstName: "Robert",
          lastName: "Brown",
          studentCode: "STU-101",
          attendanceRecords: [
            { status: "ABSENT", markedAt: tenDaysAgo },
            { status: "ABSENT", markedAt: tenDaysAgo },
            { status: "ABSENT", markedAt: tenDaysAgo },
            { status: "PRESENT", markedAt: tenDaysAgo },
          ], // 25% attendance (< 75%)
          assignmentSubmissions: [], // 2 overdue
          learningItemProgress: [{ updatedAt: tenDaysAgo }], // Inactive 10 days (> 7)
          academicEnrollments: [{ classGroup: { name: "Class 10" }, section: { name: "A" } }],
        },
      ]);

      const result = await getAtRiskStudents(teacherCtx);

      expect(result.items).toHaveLength(1);
      const atRisk = result.items[0];
      expect(atRisk.fullName).toBe("Robert Brown");
      expect(atRisk.riskLevel).toBe("CRITICAL"); // 3 reasons
      expect(atRisk.riskReasons.some((r: string) => r.includes("Low Attendance"))).toBe(true);
      expect(atRisk.riskReasons.some((r: string) => r.includes("overdue"))).toBe(true);
      expect(atRisk.riskReasons.some((r: string) => r.includes("7 days"))).toBe(true);
    });

    it("9. getTeacherDashboard master aggregator parallel execution & Redis cache hit", async () => {
      const cachedData = {
        teacherId,
        cachedAt: "2026-10-15T12:00:00Z",
        kpis: {} as any,
        charts: {} as any,
        todayClasses: [],
        pendingAttendance: [],
        pendingGrading: [],
        atRiskStudents: [],
      };

      (cacheHelper.get as any).mockResolvedValueOnce(cachedData);

      const result = await getTeacherDashboard(teacherCtx);

      expect(result).toBe(cachedData);
      expect(cacheHelper.get).toHaveBeenCalledWith(`dash:teacher:${teacherId}:all`);
      // Should NOT execute subqueries on cache hit
      expect(prisma.classRoutine.findMany).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECTION 2: ADMIN DASHBOARD TESTS
  // ==========================================
  describe("Institute Admin Dashboard (scope INSTITUTE)", () => {
    it("1. getEnrollmentTrend generates 6-month trend chart", async () => {
      (prisma.studentAcademicEnrollment.findMany as any).mockResolvedValue([
        { enrolledAt: new Date() },
        { enrolledAt: new Date() },
      ]);
      (prisma.student.count as any).mockResolvedValue(150);
      (prisma.studentAcademicEnrollment.count as any).mockResolvedValue(140);

      const result = await getEnrollmentTrend(adminCtx);

      expect(result.chart).toBeDefined();
      expect(result.chart.length).toBeGreaterThan(0);
      expect(result.kpis[0].title).toBe("Total Active Students");
      expect(result.kpis[0].value).toBe(150);
    });

    it("2. getAttendanceRate returns institute status breakdown", async () => {
      (prisma.attendanceRecord.groupBy as any).mockResolvedValue([
        { status: "PRESENT", _count: { id: 900 } },
        { status: "ABSENT", _count: { id: 100 } },
      ]);
      (prisma.attendanceSession.count as any).mockResolvedValue(25);

      const result = await getAttendanceRate(adminCtx);

      expect(result.chart).toHaveLength(4);
      expect(result.kpis[0].value).toBe(90); // 90%
    });

    it("3. getResultPassRate computes institute pass rate and GPA", async () => {
      (prisma.studentResult.findMany as any).mockResolvedValue([
        { percentage: 85, gpa: 4.0 },
        { percentage: 70, gpa: 3.5 },
        { percentage: 35, gpa: 0.0 }, // failed
      ]);

      const result = await getResultPassRate(adminCtx);

      expect(result.chart).toEqual([
        { label: "Passed", value: 2 },
        { label: "Failed", value: 1 },
      ]);
      expect(result.kpis[0].value).toBe(66.7); // 2/3 * 100%
      expect(result.kpis[1].value).toBe(2.5); // (4.0+3.5+0)/3
    });

    it("4. getLmsEngagement aggregates digital learning actions", async () => {
      (prisma.learningItemProgress.count as any).mockResolvedValue(1250);
      (prisma.courseEnrollment.count as any)
        .mockResolvedValueOnce(85) // completed courses
        .mockResolvedValueOnce(320); // active course enrollments
      (prisma.assignmentSubmission.count as any).mockResolvedValue(640);

      const result = await getLmsEngagement(adminCtx);

      expect(result.chart).toHaveLength(4);
      expect(result.kpis[0].title).toBe("Completed Courses");
      expect(result.kpis[0].value).toBe(85);
    });

    it("5. getTeacherWorkload aggregates weekly routines and courses per teacher", async () => {
      (prisma.teacherProfile.findMany as any).mockResolvedValue([
        {
          id: "t1",
          employeeCode: "T-01",
          user: { name: "Dr. Einstein" },
          classRoutines: [{ id: "r1" }, { id: "r2" }],
          courseAssignments: [{ courseId: "c1" }],
        },
      ]);

      const result = await getTeacherWorkload(adminCtx);

      expect(result.chart).toHaveLength(1);
      expect(result.chart[0].label).toBe("Dr. Einstein");
      expect(result.chart[0].value).toBe(2);
      expect(result.kpis[0].value).toBe(1);
    });

    it("6. getSupportStats returns support ticket volume, ratings, and live sessions", async () => {
      (prisma.supportTicket.groupBy as any).mockResolvedValue([
        { status: "OPEN", _count: { id: 4 } },
        { status: "RESOLVED", _count: { id: 20 } },
      ]);
      (prisma.supportSession.count as any).mockResolvedValue(12);
      (prisma.supportTicket.findMany as any).mockResolvedValue([
        { satisfactionRating: 5 },
        { satisfactionRating: 4 },
      ]);

      const result = await getSupportStats(adminCtx);

      expect(result.chart).toHaveLength(4);
      expect(result.kpis[0].value).toBe(4); // open
      expect(result.kpis[1].value).toBe(12); // live sessions
      expect(result.kpis[2].value).toBe(4.5); // avg rating
    });

    it("7. getAdminDashboard master aggregator caches 300s in Redis", async () => {
      (cacheHelper.get as any).mockResolvedValueOnce(null);
      (prisma.studentAcademicEnrollment.findMany as any).mockResolvedValue([]);
      (prisma.student.count as any).mockResolvedValue(100);
      (prisma.studentAcademicEnrollment.count as any).mockResolvedValue(90);
      (prisma.attendanceRecord.groupBy as any).mockResolvedValue([]);
      (prisma.attendanceSession.count as any).mockResolvedValue(5);
      (prisma.studentResult.findMany as any).mockResolvedValue([]);
      (prisma.learningItemProgress.count as any).mockResolvedValue(0);
      (prisma.courseEnrollment.count as any).mockResolvedValue(0);
      (prisma.assignmentSubmission.count as any).mockResolvedValue(0);
      (prisma.teacherProfile.findMany as any).mockResolvedValue([]);
      (prisma.supportTicket.groupBy as any).mockResolvedValue([]);
      (prisma.supportSession.count as any).mockResolvedValue(0);
      (prisma.supportTicket.findMany as any).mockResolvedValue([]);
      (prisma.course.count as any).mockResolvedValue(15);

      const result = await getAdminDashboard(adminCtx);

      expect(result).toBeDefined();
      expect(result.instituteId).toBe(instituteId);
      expect(cacheHelper.set).toHaveBeenCalledWith(
        `dash:admin:${instituteId}:all`,
        expect.any(Object),
        300,
      );
    });
  });

  // ==========================================
  // SECTION 3: GUARDIAN DASHBOARD TESTS
  // ==========================================
  describe("Guardian Dashboard (scope via StudentGuardian)", () => {
    const mockGuardianProfile = {
      id: guardianId,
      userId: guardianUserId,
      instituteId,
      status: "ACTIVE",
      students: [
        {
          studentId: childId1,
          relationship: "FATHER",
          isPrimary: true,
          canViewAcademic: true,
          canViewFinance: false,
          student: {
            id: childId1,
            studentCode: "STU-001",
            firstName: "Emma",
            lastName: "Watson",
            academicEnrollments: [
              {
                classGroup: { id: classGroupId, name: "Class 8" },
                section: { id: "sec-8a", name: "A" },
                rollNumber: "12",
              },
            ],
          },
        },
        {
          studentId: childId2,
          relationship: "FATHER",
          isPrimary: false,
          canViewAcademic: false, // RESTRICTED ACADEMIC
          canViewFinance: true,
          student: {
            id: childId2,
            studentCode: "STU-002",
            firstName: "George",
            lastName: "Watson",
            academicEnrollments: [
              {
                classGroup: { id: "cg-9", name: "Class 9" },
                section: { id: "sec-9b", name: "B" },
                rollNumber: "05",
              },
            ],
          },
        },
      ],
    };

    beforeEach(() => {
      (prisma.guardian.findFirst as any).mockResolvedValue(mockGuardianProfile);
    });

    it("1. listChildren allows switching between registered wards", async () => {
      const result = await listChildren(guardianCtx);

      expect(result.primaryChildId).toBe(childId1);
      expect(result.children).toHaveLength(2);
      expect(result.children[0].fullName).toBe("Emma Watson");
      expect(result.children[0].classGroup).toBe("Class 8");
      expect(result.children[1].fullName).toBe("George Watson");
      expect(result.children[1].canViewAcademic).toBe(false);
    });

    it("2. getChildAttendance returns ward attendance breakdown", async () => {
      (prisma.attendanceRecord.findMany as any).mockResolvedValue([
        {
          status: "PRESENT",
          remarks: "On time",
          session: { date: new Date(), subject: { name: "Math" } },
        },
        {
          status: "ABSENT",
          remarks: "Sick leave",
          session: { date: new Date(), subject: { name: "English" } },
        },
      ]);

      const result = await getChildAttendance(guardianCtx, childId1);

      expect(result.kpis[0].title).toBe("Attendance Rate");
      expect(result.chart).toHaveLength(4);
      expect(result.recentRecords).toHaveLength(2);
    });

    it("3. getChildResults returns subject marks when canViewAcademic is true", async () => {
      (prisma.studentResult.findMany as any).mockResolvedValue([
        {
          id: "res-1",
          calculatedMarks: 92,
          percentage: 92,
          gpa: 4.0,
          grade: "A+",
          subject: { name: "Mathematics" },
        },
      ]);

      const result = await getChildResults(guardianCtx, childId1);

      expect(result.chart).toEqual([
        { label: "Mathematics", value: 92, gpa: 4.0, grade: "A+" },
      ]);
      expect(result.kpis[0].value).toBe(4.0);
    });

    it("4. getChildResults throws 403 Forbidden when canViewAcademic is false", async () => {
      await expect(getChildResults(guardianCtx, childId2)).rejects.toThrow(
        /Academic records viewing is restricted/,
      );
    });

    it("5. getChildNotices retrieves notices targeted to ward's class and institute", async () => {
      (prisma.notice.findMany as any).mockResolvedValue([
        {
          id: "notice-class8",
          title: "Class 8 Science Project",
          content: "Details regarding exhibition",
          category: "ACADEMIC",
          pinned: true,
          publishAt: new Date(),
        },
      ]);

      const result = await getChildNotices(guardianCtx, childId1);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Class 8 Science Project");
    });

    it("6. getGuardianDashboard defaults to primary child and caches 120s in Redis", async () => {
      (cacheHelper.get as any).mockResolvedValueOnce(null);
      (prisma.attendanceRecord.findMany as any).mockResolvedValue([]);
      (prisma.notice.findMany as any).mockResolvedValue([]);
      (prisma.courseEnrollment.count as any).mockResolvedValue(3);
      (prisma.exam.count as any).mockResolvedValue(1);
      (prisma.studentResult.findMany as any).mockResolvedValue([]);

      const result = await getGuardianDashboard(guardianCtx);

      expect(result.activeChild?.childId).toBe(childId1);
      expect(result.availableChildren).toHaveLength(2);
      expect(cacheHelper.set).toHaveBeenCalledWith(
        `dash:guardian:${guardianId}:${childId1}:all`,
        expect.any(Object),
        120,
      );
    });

    it("7. getGuardianDashboard handles academic restricted ward gracefully without error", async () => {
      (cacheHelper.get as any).mockResolvedValueOnce(null);
      (prisma.attendanceRecord.findMany as any).mockResolvedValue([]);
      (prisma.notice.findMany as any).mockResolvedValue([]);
      (prisma.courseEnrollment.count as any).mockResolvedValue(2);
      (prisma.exam.count as any).mockResolvedValue(0);

      const result = await getGuardianDashboard(guardianCtx, childId2);

      expect(result.activeChild?.childId).toBe(childId2);
      expect(result.results?.isRestricted).toBe(true);
      expect(result.kpis?.gpa.value).toBe("Restricted");
    });
  });
});
