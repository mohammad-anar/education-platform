import { describe, it, expect, beforeEach, vi } from "vitest";
import { StatusCodes } from "http-status-codes";
import { StudentValidation } from "./student/student.validation.js";
import { TeacherValidation } from "./teacher/teacher.validation.js";
import { StaffValidation } from "./staff/staff.validation.js";
import { StudentService } from "./student/student.service.js";
import { TeacherService } from "./teacher/teacher.service.js";
import { StaffService } from "./staff/staff.service.js";
import { validateRequest } from "../../middleware/validate.middleware.js";
import { errorHandler } from "../../middleware/error.middleware.js";
import prisma from "../../config/prisma.js";
import * as auditModule from "../../utils/audit.js";

vi.mock("../../config/prisma.js", () => ({
  default: {
    student: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    studentDocument: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    teacherProfile: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    teacherQualification: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    staffProfile: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    staffDocument: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    fileAsset: {
      findFirst: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

vi.mock("../../utils/audit.js", () => ({
  logAudit: vi.fn().mockResolvedValue({ id: "mock-audit-id" }),
  buildDiff: vi.fn().mockReturnValue({ changed: true }),
}));

describe("Step 5 - Persona Profiles (Student / Teacher / Staff)", () => {
  let mockReq: any;
  let mockRes: any;
  let nextFn: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      body: {},
      query: {},
      params: {},
      ctx: {
        userId: "11111111-1111-1111-1111-111111111111",
        instituteId: "22222222-2222-2222-2222-222222222222",
        isPlatformAdmin: false,
      },
    };

    mockRes = {
      statusCode: 200,
      status: vi.fn().mockImplementation(function (code: number) {
        mockRes.statusCode = code;
        return mockRes;
      }),
      json: vi.fn().mockImplementation(function (data: any) {
        mockRes.jsonData = data;
        return mockRes;
      }),
    };

    nextFn = vi.fn();
  });

  // =========================================================================
  // 1. ACCEPTANCE REQUIREMENT: Student PATCH /me with status rejected 400
  // =========================================================================
  describe("Acceptance: Student Self-Update Validation Guard", () => {
    it("rejects PATCH /me with status field with HTTP 400 via validateRequest & errorHandler", async () => {
      mockReq.body = {
        fatherName: "Jane Doe Sr.",
        status: "GRADUATED", // DISALLOWED FIELD
      };

      const middleware = validateRequest(StudentValidation.selfUpdateZodSchema);
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const validationError = nextFn.mock.calls[0][0];
      expect(validationError).toBeDefined();

      // Pass error to the global errorHandler to confirm HTTP 400 response
      errorHandler(validationError, mockReq, mockRes, () => {});

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockRes.jsonData.success).toBe(false);
      expect(mockRes.jsonData.message).toBe("Validation Error");
      expect(mockRes.jsonData.errorMessages.some((e: any) => e.path.includes("status"))).toBe(true);
    });

    it("rejects studentCode or admissionDate in student PATCH /me", async () => {
      mockReq.body = {
        studentCode: "STU-9999",
      };

      const middleware = validateRequest(StudentValidation.selfUpdateZodSchema);
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const err = nextFn.mock.calls[0][0];
      expect(err).toBeDefined();

      errorHandler(err, mockReq, mockRes, () => {});
      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
      expect(mockRes.jsonData.errorMessages.some((e: any) => e.path.includes("studentCode"))).toBe(true);
    });

    it("accepts valid student self-editable fields", async () => {
      mockReq.body = {
        nationality: "Bangladeshi",
        religion: "Islam",
        nationalId: "19901234567890",
        birthCertificateNo: "20001234567890123",
        presentAddress: { street: "123 Dhaka Ave", city: "Dhaka" },
        permanentAddress: { street: "456 Village Rd", city: "Sylhet" },
        alternatePhone: "+8801700000000",
        previousSchool: "Chittagong High School",
        fatherName: "Karim Ahmed",
        motherName: "Fatema Begum",
        allergies: "Peanuts",
        medicalConditions: "None",
        language: "Bengali",
      };

      const middleware = validateRequest(StudentValidation.selfUpdateZodSchema);
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith(); // called without error
      expect(mockReq.body.nationality).toBe("Bangladeshi");
    });
  });

  // =========================================================================
  // 2. Teacher & Staff Self-Update Validation
  // =========================================================================
  describe("Teacher & Staff Self-Update Validation Guards", () => {
    it("rejects teacher PATCH /me with employeeCode or employmentStatus", async () => {
      mockReq.body = {
        bio: "Senior Physics Lecturer",
        employeeCode: "T-001",
        employmentStatus: "TERMINATED",
      };

      const middleware = validateRequest(TeacherValidation.selfUpdateZodSchema);
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const err = nextFn.mock.calls[0][0];
      errorHandler(err, mockReq, mockRes, () => {});

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    it("accepts valid teacher self-editable fields", async () => {
      mockReq.body = {
        bio: "Senior Physics Lecturer with 10 years experience",
        headline: "Passionate STEM Educator",
        languages: ["English", "Bengali"],
        officePhone: "+8801711111111",
        publicEmail: "teacher@institute.edu",
        officeRoom: "Room 402",
        officeHours: { monday: "10am-12pm" },
        socialLinks: { linkedin: "https://linkedin.com/in/teacher" },
        nationalId: "9876543210",
        address: { city: "Dhaka" },
        acceptsSupportSessions: true,
        defaultMeetingUrl: "https://meet.google.com/abc-defg-hij",
        language: "English",
      };

      const middleware = validateRequest(TeacherValidation.selfUpdateZodSchema);
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith();
      expect(mockReq.body.headline).toBe("Passionate STEM Educator");
    });

    it("rejects staff PATCH /me with staffType or employeeCode", async () => {
      mockReq.body = {
        phone: "+8801800000000",
        staffType: "ADMIN",
        employeeCode: "EMP-007",
      };

      const middleware = validateRequest(StaffValidation.selfUpdateZodSchema);
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalled();
      const err = nextFn.mock.calls[0][0];
      errorHandler(err, mockReq, mockRes, () => {});

      expect(mockRes.status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    });

    it("accepts valid staff self-editable fields", async () => {
      mockReq.body = {
        phone: "+8801811111111",
        address: { city: "Dhaka", postalCode: "1205" },
        emergencyContact: { name: "Brother", phone: "+8801911111111" },
        acceptsSupportSessions: true,
        defaultMeetingUrl: "https://meet.google.com/staff-room",
        visibility: { phone: "staff_only" },
      };

      const middleware = validateRequest(StaffValidation.selfUpdateZodSchema);
      await middleware(mockReq, mockRes, nextFn);

      expect(nextFn).toHaveBeenCalledWith();
      expect(mockReq.body.phone).toBe("+8801811111111");
    });
  });

  // =========================================================================
  // 3. Student Service Functionality
  // =========================================================================
  describe("StudentService", () => {
    it("getMyProfile finds student profile by current userId and instituteId", async () => {
      const mockStudent = {
        id: "stu-123",
        userId: mockReq.ctx.userId,
        instituteId: mockReq.ctx.instituteId,
        studentCode: "STU-001",
        fatherName: "Father",
      };

      (prisma.student.findFirst as any).mockResolvedValue(mockStudent);

      const result = await StudentService.getMyProfile(mockReq.ctx);

      expect(prisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockReq.ctx.userId,
            instituteId: mockReq.ctx.instituteId,
          },
        }),
      );
      expect(result.id).toBe("stu-123");
    });

    it("updateMyProfile updates self fields for current student", async () => {
      const mockStudent = {
        id: "stu-123",
        userId: mockReq.ctx.userId,
        instituteId: mockReq.ctx.instituteId,
      };
      (prisma.student.findFirst as any).mockResolvedValue(mockStudent);
      (prisma.student.update as any).mockResolvedValue({
        ...mockStudent,
        fatherName: "New Father Name",
      });

      const result = await StudentService.updateMyProfile(mockReq.ctx, {
        fatherName: "New Father Name",
      });

      expect(prisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "stu-123" },
          data: { fatherName: "New Father Name" },
        }),
      );
      expect(result.fatherName).toBe("New Father Name");
    });

    it("adminUpdateProfile records an audit log with diff", async () => {
      const oldStudent = {
        id: "stu-123",
        instituteId: mockReq.ctx.instituteId,
        status: "ACTIVE",
        fatherName: "Old Name",
      };
      const updatedStudent = {
        id: "stu-123",
        instituteId: mockReq.ctx.instituteId,
        status: "SUSPENDED",
        statusReason: "Disciplinary action",
        fatherName: "Old Name",
      };

      (prisma.student.findFirst as any).mockResolvedValue(oldStudent);
      (prisma.student.update as any).mockResolvedValue(updatedStudent);

      const result = await StudentService.adminUpdateProfile(mockReq.ctx, "stu-123", {
        status: "SUSPENDED",
        statusReason: "Disciplinary action",
      });

      expect(prisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "stu-123" },
          data: { status: "SUSPENDED", statusReason: "Disciplinary action" },
        }),
      );
      expect(auditModule.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          ctx: mockReq.ctx,
          action: "STUDENT_PROFILE_UPDATE",
          entityType: "Student",
          entityId: "stu-123",
          oldValue: oldStudent,
          newValue: updatedStudent,
        }),
      );
      expect(result.status).toBe("SUSPENDED");
    });

    it("uploadProfilePhoto links valid fileAsset to student profile", async () => {
      const mockStudent = { id: "stu-123", userId: mockReq.ctx.userId, instituteId: mockReq.ctx.instituteId };
      const mockFile = { id: "file-asset-uuid", instituteId: mockReq.ctx.instituteId };

      (prisma.student.findFirst as any).mockResolvedValue(mockStudent);
      (prisma.fileAsset.findFirst as any).mockResolvedValue(mockFile);
      (prisma.student.update as any).mockResolvedValue({
        ...mockStudent,
        photoFileAssetId: "file-asset-uuid",
      });

      const result = await StudentService.uploadProfilePhoto(mockReq.ctx, "file-asset-uuid");

      expect(prisma.student.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "stu-123" },
          data: { photoFileAssetId: "file-asset-uuid" },
        }),
      );
      expect(result.photoFileAssetId).toBe("file-asset-uuid");
    });

    it("addDocument creates student document and removeDocument deletes it", async () => {
      const mockStudent = { id: "stu-123", userId: mockReq.ctx.userId, instituteId: mockReq.ctx.instituteId };
      (prisma.student.findFirst as any).mockResolvedValue(mockStudent);
      (prisma.fileAsset.findFirst as any).mockResolvedValue({ id: "file-1", instituteId: mockReq.ctx.instituteId });
      (prisma.studentDocument.create as any).mockResolvedValue({
        id: "doc-1",
        title: "Birth Certificate",
        studentId: "stu-123",
      });

      const doc = await StudentService.addDocument(mockReq.ctx, {
        title: "Birth Certificate",
        documentType: "BIRTH_CERTIFICATE",
        fileAssetId: "file-1",
      });

      expect(doc.id).toBe("doc-1");

      // Remove Document
      (prisma.studentDocument.findFirst as any).mockResolvedValue({ id: "doc-1", studentId: "stu-123" });
      (prisma.studentDocument.delete as any).mockResolvedValue({ id: "doc-1" });

      const removeResult = await StudentService.removeDocument(mockReq.ctx, "doc-1");
      expect(removeResult.success).toBe(true);
      expect(prisma.studentDocument.delete).toHaveBeenCalledWith({ where: { id: "doc-1" } });
    });
  });

  // =========================================================================
  // 4. Teacher Service Functionality
  // =========================================================================
  describe("TeacherService", () => {
    it("getMyProfile finds teacher profile by current user", async () => {
      const mockTeacher = {
        id: "teach-123",
        userId: mockReq.ctx.userId,
        instituteId: mockReq.ctx.instituteId,
        bio: "Teacher bio",
      };
      (prisma.teacherProfile.findFirst as any).mockResolvedValue(mockTeacher);

      const result = await TeacherService.getMyProfile(mockReq.ctx);
      expect(result.id).toBe("teach-123");
    });

    it("adminUpdateProfile records an audit log with diff", async () => {
      const oldTeacher = { id: "teach-123", bio: "Old bio", employmentStatus: "ACTIVE" };
      const newTeacher = { id: "teach-123", bio: "New bio", employmentStatus: "ON_LEAVE" };

      (prisma.teacherProfile.findFirst as any).mockResolvedValue(oldTeacher);
      (prisma.teacherProfile.update as any).mockResolvedValue(newTeacher);

      await TeacherService.adminUpdateProfile(mockReq.ctx, "teach-123", {
        employmentStatus: "ON_LEAVE",
      });

      expect(auditModule.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "TEACHER_PROFILE_UPDATE",
          entityType: "TeacherProfile",
          entityId: "teach-123",
        }),
      );
    });

    it("addQualification creates qualification and removeQualification deletes it", async () => {
      const mockTeacher = { id: "teach-123", userId: mockReq.ctx.userId, instituteId: mockReq.ctx.instituteId };
      (prisma.teacherProfile.findFirst as any).mockResolvedValue(mockTeacher);
      (prisma.teacherQualification.create as any).mockResolvedValue({
        id: "qual-1",
        degree: "M.Sc Physics",
        institution: "University of Dhaka",
      });

      const qual = await TeacherService.addQualification(mockReq.ctx, {
        degree: "M.Sc Physics",
        institution: "University of Dhaka",
        passingYear: 2018,
      });

      expect(qual.id).toBe("qual-1");

      // Remove qualification
      (prisma.teacherQualification.findFirst as any).mockResolvedValue({ id: "qual-1", teacherProfileId: "teach-123" });
      (prisma.teacherQualification.delete as any).mockResolvedValue({ id: "qual-1" });

      const removeResult = await TeacherService.removeQualification(mockReq.ctx, "qual-1");
      expect(removeResult.success).toBe(true);
    });
  });

  // =========================================================================
  // 5. Staff Service Functionality
  // =========================================================================
  describe("StaffService", () => {
    it("getMyProfile finds staff profile by current user", async () => {
      const mockStaff = {
        id: "staff-123",
        userId: mockReq.ctx.userId,
        instituteId: mockReq.ctx.instituteId,
        staffType: "LIBRARIAN",
      };
      (prisma.staffProfile.findFirst as any).mockResolvedValue(mockStaff);

      const result = await StaffService.getMyProfile(mockReq.ctx);
      expect(result.id).toBe("staff-123");
    });

    it("adminUpdateProfile records an audit log with diff", async () => {
      const oldStaff = { id: "staff-123", staffType: "OTHER", employmentStatus: "ACTIVE" };
      const newStaff = { id: "staff-123", staffType: "ACCOUNTANT", employmentStatus: "ACTIVE" };

      (prisma.staffProfile.findFirst as any).mockResolvedValue(oldStaff);
      (prisma.staffProfile.update as any).mockResolvedValue(newStaff);

      await StaffService.adminUpdateProfile(mockReq.ctx, "staff-123", {
        staffType: "ACCOUNTANT",
      });

      expect(auditModule.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "STAFF_PROFILE_UPDATE",
          entityType: "StaffProfile",
          entityId: "staff-123",
        }),
      );
    });

    it("addDocument creates staff document and removeDocument deletes it", async () => {
      const mockStaff = { id: "staff-123", userId: mockReq.ctx.userId, instituteId: mockReq.ctx.instituteId };
      (prisma.staffProfile.findFirst as any).mockResolvedValue(mockStaff);
      (prisma.staffDocument.create as any).mockResolvedValue({
        id: "sdoc-1",
        title: "Joining Letter",
        staffProfileId: "staff-123",
      });

      const doc = await StaffService.addDocument(mockReq.ctx, {
        title: "Joining Letter",
      });

      expect(doc.id).toBe("sdoc-1");

      // Remove Document
      (prisma.staffDocument.findFirst as any).mockResolvedValue({ id: "sdoc-1", staffProfileId: "staff-123" });
      (prisma.staffDocument.delete as any).mockResolvedValue({ id: "sdoc-1" });

      const removeResult = await StaffService.removeDocument(mockReq.ctx, "sdoc-1");
      expect(removeResult.success).toBe(true);
    });

    it("updateMyNotificationPrefs and updateMyVisibility save preferences", async () => {
      const mockStaff = { id: "staff-123", userId: mockReq.ctx.userId, instituteId: mockReq.ctx.instituteId, metadata: {} };
      (prisma.staffProfile.findFirst as any).mockResolvedValue(mockStaff);
      (prisma.staffProfile.update as any).mockImplementation(({ data }: any) => Promise.resolve({ ...mockStaff, ...data }));

      const notifResult = await StaffService.updateMyNotificationPrefs(mockReq.ctx, { email: true, sms: false });
      expect(notifResult.success).toBe(true);

      const visResult = await StaffService.updateMyVisibility(mockReq.ctx, { phone: "public" });
      expect(visResult.success).toBe(true);
      expect(visResult.visibility).toEqual({ phone: "public" });
    });
  });
});
