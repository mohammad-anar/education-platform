import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../config/prisma.js";

// Import sampled services
import { StudentService } from "./people/student/student.service.js";
import { TeacherService } from "./people/teacher/teacher.service.js";
import { StaffService } from "./people/staff/staff.service.js";
import { GuardianService } from "./people/guardian/guardian.service.js";
import { AcademicYearService } from "./academic/academicYear/academicYear.service.js";
import { ProgramService } from "./academic/program/program.service.js";
import { LevelService } from "./academic/level/level.service.js";
import { ClassGroupService } from "./academic/classGroup/classGroup.service.js";
import { SectionService } from "./academic/section/section.service.js";
import { SubjectService } from "./academic/subject/subject.service.js";
import { EnrollmentService } from "./academic/enrollment/enrollment.service.js";
import { CourseService } from "./lms/course/course.service.js";
import { ModuleService } from "./lms/module/module.service.js";
import { LessonService } from "./lms/lesson/lesson.service.js";
import { LessonVideoService } from "./lms/lessonVideo/lessonVideo.service.js";
import { PolicyService } from "./attendance/policy/policy.service.js";
import { CalendarService } from "./attendance/calendar/calendar.service.js";
import { SessionService } from "./attendance/session/session.service.js";
import { RoutineService } from "./attendance/routine/routine.service.js";
import { MarkingSchemeService } from "./assessment/markingScheme/markingScheme.service.js";
import { AssessmentService } from "./assessment/assessment/assessment.service.js";
import { ExamService } from "./assessment/exam/exam.service.js";
import { ResultService } from "./assessment/result/result.service.js";
import * as noticeService from "./platform/notice/notice.service.js";
import { FileService } from "./platform/file/file.service.js";
import * as supportService from "./support/support.service.js";

// Mock prisma
vi.mock("../config/prisma.js", () => {
  const modelMock = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    create: vi.fn().mockResolvedValue({ id: "created-id" }),
    update: vi.fn().mockResolvedValue({ id: "updated-id" }),
    delete: vi.fn().mockResolvedValue({ id: "deleted-id" }),
    upsert: vi.fn().mockResolvedValue({ id: "upserted-id" }),
  });

  return {
    default: {
      student: modelMock(),
      teacherProfile: modelMock(),
      staffProfile: modelMock(),
      guardian: modelMock(),
      academicYear: modelMock(),
      program: modelMock(),
      level: modelMock(),
      classGroup: modelMock(),
      section: modelMock(),
      subject: modelMock(),
      studentAcademicEnrollment: modelMock(),
      course: modelMock(),
      module: modelMock(),
      lesson: modelMock(),
      lessonVideo: modelMock(),
      attendancePolicy: modelMock(),
      attendanceCalendar: modelMock(),
      attendanceSession: modelMock(),
      classRoutine: modelMock(),
      markingScheme: modelMock(),
      assessment: modelMock(),
      exam: modelMock(),
      studentResult: modelMock(),
      notice: modelMock(),
      fileAsset: modelMock(),
      supportTicket: modelMock(),
      instituteMembership: modelMock(),
      userRole: modelMock(),
      user: modelMock(),
      role: modelMock(),
      permission: modelMock(),
      auditLog: { create: vi.fn() },
      notification: { create: vi.fn(), createMany: vi.fn() },
    },
  };
});

describe("Step 14 - Multi-Tenant Isolation & Leak Prevention (30 Sampled Endpoints)", () => {
  const TENANT_A = "11111111-1111-1111-1111-111111111111";
  const TENANT_B = "22222222-2222-2222-2222-222222222222";

  const ctxTenantA = {
    userId: "user-tenant-a",
    instituteId: TENANT_A,
    isPlatformAdmin: false,
    roles: ["INSTITUTE_ADMIN"],
  };

  const pagination = { page: 1, limit: 10 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1-8: People Domain
  it("01. StudentService.getAll: blocks cross-tenant leakage when attacker requests Tenant B", async () => {
    await StudentService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("02. TeacherService.getAll: enforces Tenant A boundary even if filter contains Tenant B", async () => {
    await TeacherService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.teacherProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("03. StaffService.getAll: strictly isolates staff records to Tenant A", async () => {
    await StaffService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.staffProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("04. GuardianService.getAll: strictly isolates guardian records to Tenant A", async () => {
    await GuardianService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.guardian.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  // 5-11: Academic Domain
  it("05. AcademicYearService.getAll: enforces instituteId = Tenant A", async () => {
    await AcademicYearService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.academicYear.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("06. ProgramService.getAll: enforces instituteId = Tenant A", async () => {
    await ProgramService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.program.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("07. LevelService.getAll: enforces instituteId = Tenant A", async () => {
    await LevelService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.level.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("08. ClassGroupService.getAll: enforces instituteId = Tenant A", async () => {
    await ClassGroupService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.classGroup.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("09. SectionService.getAll: enforces instituteId = Tenant A", async () => {
    await SectionService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.section.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("10. SubjectService.getAll: enforces instituteId = Tenant A", async () => {
    await SubjectService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.subject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("11. EnrollmentService.getAll: enforces instituteId = Tenant A", async () => {
    await EnrollmentService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.studentAcademicEnrollment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  // 12-16: LMS Domain
  it("12. CourseService.getAll: enforces instituteId = Tenant A", async () => {
    await CourseService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("13. ModuleService.getAll: enforces instituteId = Tenant A", async () => {
    await ModuleService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.module.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("14. LessonService.getAll: enforces instituteId = Tenant A", async () => {
    await LessonService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.lesson.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("15. LessonVideoService.getAll: enforces instituteId = Tenant A", async () => {
    await LessonVideoService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.lessonVideo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  // 16-20: Attendance Domain
  it("16. PolicyService.getAll: enforces instituteId = Tenant A", async () => {
    await PolicyService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.attendancePolicy.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("17. CalendarService.getAll: enforces instituteId = Tenant A", async () => {
    await CalendarService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.attendanceCalendar.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("18. SessionService.getAll: enforces instituteId = Tenant A", async () => {
    await SessionService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.attendanceSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("19. RoutineService.getAll: enforces instituteId = Tenant A", async () => {
    await RoutineService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.classRoutine.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  // 20-24: Assessment Domain
  it("20. MarkingSchemeService.getAll: enforces instituteId = Tenant A", async () => {
    await MarkingSchemeService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.markingScheme.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("21. AssessmentService.getAll: enforces instituteId = Tenant A", async () => {
    await AssessmentService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.assessment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("22. ExamService.getAll: enforces instituteId = Tenant A", async () => {
    await ExamService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.exam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("23. ResultService.getAll: enforces instituteId = Tenant A", async () => {
    await ResultService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.studentResult.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  // 24-27: Platform Domain
  it("24. FileService.getAll: enforces instituteId = Tenant A", async () => {
    await FileService.getAll({ instituteId: TENANT_B } as any, pagination, ctxTenantA);
    expect(prisma.fileAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("25. noticeService.listMyNotices: restricts notice queries strictly to Tenant A", async () => {
    await noticeService.listMyNotices(ctxTenantA, {});
    expect(prisma.notice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  // 26-30: Support Domain & Cross-Tenant Detail / Mutation Isolation
  it("26. supportService.listTicketQueue: enforces instituteId = Tenant A in ticket queue", async () => {
    await supportService.listTicketQueue(ctxTenantA, {});
    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ instituteId: TENANT_A }),
      }),
    );
  });

  it("27. supportService.getMyTicket: throws 404 when requesting a ticket from Tenant B", async () => {
    (prisma.supportTicket.findFirst as any).mockResolvedValue(null);
    await expect(
      supportService.getMyTicket(ctxTenantA, "ticket-belonging-to-tenant-b"),
    ).rejects.toThrow();
  });

  it("28. noticeService.updateNotice: prevents updating a notice belonging to Tenant B", async () => {
    (prisma.notice.findFirst as any).mockResolvedValue(null);
    await expect(
      noticeService.updateNotice("notice-of-tenant-b", { title: "Hacked" }, ctxTenantA),
    ).rejects.toThrow("Notice not found");
  });

  it("29. noticeService.deleteNotice: prevents deleting a notice belonging to Tenant B", async () => {
    (prisma.notice.findFirst as any).mockResolvedValue(null);
    await expect(
      noticeService.deleteNotice("notice-of-tenant-b", ctxTenantA),
    ).rejects.toThrow("Notice not found");
  });

  it("30. supportService.addInternalNote: rejects adding note to a ticket belonging to Tenant B", async () => {
    (prisma.supportTicket.findFirst as any).mockResolvedValue(null);
    await expect(
      supportService.addInternalNote(ctxTenantA, "ticket-of-tenant-b", { note: "Leaked Note" }),
    ).rejects.toThrow("Ticket not found");
  });
});
