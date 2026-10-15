import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  canViewerSee,
  serializeTeacherForViewer,
  serializeStaffForViewer,
  serializeInstituteForViewer,
  updateTeacherVisibility,
  updateInstituteContactVisibility,
} from "./visibility.service.js";
import { DirectoryService } from "./directory.service.js";
import prisma from "../../config/prisma.js";
import * as auditModule from "../../utils/audit.js";

vi.mock("../../config/prisma.js", () => ({
  default: {
    student: {
      findFirst: vi.fn(),
    },
    teacherProfile: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    staffProfile: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    institute: {
      findUnique: vi.fn(),
    },
    institutePublicProfile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
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

describe("Step 6 - Visibility & Directory", () => {
  const instituteId = "11111111-1111-1111-1111-111111111111";
  const teacherUserId = "22222222-2222-2222-2222-222222222222";
  const teacherProfileId = "33333333-3333-3333-3333-333333333333";
  const studentUserId = "44444444-4444-4444-4444-444444444444";
  const outsiderUserId = "99999999-9999-9999-9999-999999999999";

  const teacherOwnerCtx = {
    userId: teacherUserId,
    instituteId,
    isPlatformAdmin: false,
  };

  const studentViewerCtx = {
    userId: studentUserId,
    instituteId,
    isPlatformAdmin: false,
    isEnrolledStudent: true,
  };

  const nonEnrolledStudentCtx = {
    userId: studentUserId,
    instituteId,
    isPlatformAdmin: false,
    isEnrolledStudent: false,
  };

  const platformAdminCtx = {
    userId: "admin-uuid",
    instituteId: null,
    isPlatformAdmin: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. canViewerSee rule engine
  // =========================================================================
  describe("canViewerSee(visibilityLevel, viewerCtx, owner)", () => {
    const owner = { userId: teacherUserId, instituteId, id: teacherProfileId };

    it("allows owner to see HIDDEN, ENROLLED_STUDENTS, MEMBERS, PUBLIC", async () => {
      expect(await canViewerSee("HIDDEN", teacherOwnerCtx, owner)).toBe(true);
      expect(await canViewerSee("ENROLLED_STUDENTS", teacherOwnerCtx, owner)).toBe(true);
      expect(await canViewerSee("MEMBERS", teacherOwnerCtx, owner)).toBe(true);
      expect(await canViewerSee("PUBLIC", teacherOwnerCtx, owner)).toBe(true);
    });

    it("allows platform super admin to see everything", async () => {
      expect(await canViewerSee("HIDDEN", platformAdminCtx, owner)).toBe(true);
      expect(await canViewerSee("ENROLLED_STUDENTS", platformAdminCtx, owner)).toBe(true);
    });

    it("strictly blocks HIDDEN for student viewers and outside members", async () => {
      expect(await canViewerSee("HIDDEN", studentViewerCtx, owner)).toBe(false);
      expect(await canViewerSee("HIDDEN", { userId: outsiderUserId, instituteId }, owner)).toBe(false);
    });

    it("evaluates ENROLLED_STUDENTS: allows active enrolled student, blocks non-enrolled student", async () => {
      expect(await canViewerSee("ENROLLED_STUDENTS", studentViewerCtx, owner)).toBe(true);
      expect(await canViewerSee("ENROLLED_STUDENTS", nonEnrolledStudentCtx, owner)).toBe(false);
    });

    it("evaluates MEMBERS: allows institute member, blocks cross-tenant or unauthenticated", async () => {
      expect(await canViewerSee("MEMBERS", studentViewerCtx, owner)).toBe(true);
      expect(await canViewerSee("MEMBERS", { userId: outsiderUserId, instituteId: "different-inst" }, owner)).toBe(false);
      expect(await canViewerSee("MEMBERS", null, owner)).toBe(false);
    });

    it("evaluates PUBLIC: allows everyone", async () => {
      expect(await canViewerSee("PUBLIC", null, owner)).toBe(true);
      expect(await canViewerSee("PUBLIC", studentViewerCtx, owner)).toBe(true);
    });

    it("queries Prisma for ENROLLED_STUDENTS when isEnrolledStudent is not pre-computed", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stu-1" });

      const res = await canViewerSee("ENROLLED_STUDENTS", { userId: studentUserId, instituteId }, owner);
      expect(res).toBe(true);
      expect(prisma.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: studentUserId,
            instituteId,
            status: "ACTIVE",
          }),
        }),
      );
    });
  });

  // =========================================================================
  // 2. ACCEPTANCE REQUIREMENT: Hidden phone/email never appears in JSON
  //    for student viewer, and appears for the owner
  // =========================================================================
  describe("Acceptance: Teacher Profile Hidden Phone/Email Serialization", () => {
    const mockTeacher = {
      id: teacherProfileId,
      instituteId,
      userId: teacherUserId,
      employeeCode: "FAC-101",
      bio: "Senior Physics Faculty",
      headline: "Quantum Mechanics Expert",
      languages: ["English", "Bengali"],
      officePhone: "+8801700000001",
      publicEmail: "teacher.office@institute.edu",
      officeRoom: "Room 402",
      officeHours: { monday: "10am - 12pm" },
      socialLinks: { linkedin: "https://linkedin.com/in/teacher" },
      address: { street: "123 Faculty Ave", city: "Dhaka" },
      nationalId: "19850123456789",
      acceptsSupportSessions: true,
      defaultMeetingUrl: "https://meet.google.com/teach-101",
      visibility: {
        phone: "HIDDEN",
        email: "HIDDEN",
        address: "HIDDEN",
        nationalId: "HIDDEN",
        officeHours: "ENROLLED_STUDENTS",
      },
      user: {
        id: teacherUserId,
        firstName: "Dr. Anisur",
        lastName: "Rahman",
        email: "anisur.personal@gmail.com",
        phone: "+8801799999999",
        avatarUrl: "https://assets.inst.edu/avatar.png",
      },
      qualifications: [{ id: "q1", degree: "Ph.D. in Physics" }],
    };

    it("NEVER exposes hidden phone or email in JSON for a student viewer", async () => {
      const serialized = await serializeTeacherForViewer(mockTeacher, studentViewerCtx);
      const jsonString = JSON.stringify(serialized);

      // Verify returned fields directly
      expect(serialized.officePhone).toBeUndefined();
      expect(serialized.publicEmail).toBeUndefined();
      expect(serialized.user?.phone).toBeUndefined();
      expect(serialized.user?.email).toBeUndefined();
      expect(serialized.address).toBeUndefined();
      expect(serialized.nationalId).toBeUndefined();
      expect(serialized.visibility).toBeUndefined(); // visibility config hidden from student

      // Strict acceptance test: ensure neither phone nor email substrings exist in serialized JSON
      expect(jsonString).not.toContain("+8801700000001");
      expect(jsonString).not.toContain("+8801799999999");
      expect(jsonString).not.toContain("teacher.office@institute.edu");
      expect(jsonString).not.toContain("anisur.personal@gmail.com");
      expect(jsonString).not.toContain('"officePhone"');
      expect(jsonString).not.toContain('"publicEmail"');

      // But enrolled student DOES see allowed fields like headline, bio, and office hours
      expect(serialized.headline).toBe("Quantum Mechanics Expert");
      expect(serialized.officeHours).toEqual({ monday: "10am - 12pm" });
    });

    it("ALWAYS includes phone and email in JSON for the owner", async () => {
      const serialized = await serializeTeacherForViewer(mockTeacher, teacherOwnerCtx);
      const jsonString = JSON.stringify(serialized);

      // Verify owner sees all their contact details
      expect(serialized.officePhone).toBe("+8801700000001");
      expect(serialized.publicEmail).toBe("teacher.office@institute.edu");
      expect(serialized.user?.phone).toBe("+8801799999999");
      expect(serialized.user?.email).toBe("anisur.personal@gmail.com");
      expect(serialized.address).toEqual({ street: "123 Faculty Ave", city: "Dhaka" });
      expect(serialized.nationalId).toBe("19850123456789");
      expect(serialized.visibility).toBeDefined();

      // Confirmed in JSON output
      expect(jsonString).toContain("+8801700000001");
      expect(jsonString).toContain("teacher.office@institute.edu");
      expect(jsonString).toContain("+8801799999999");
      expect(jsonString).toContain("anisur.personal@gmail.com");
    });
  });

  // =========================================================================
  // 3. Staff Profile Visibility Serialization
  // =========================================================================
  describe("Staff Profile Visibility Serialization", () => {
    const staffId = "staff-111";
    const staffUserId = "staff-user-222";

    const mockStaff = {
      id: staffId,
      instituteId,
      userId: staffUserId,
      employeeCode: "STF-201",
      staffType: "LIBRARIAN",
      phone: "+8801811111111",
      address: { city: "Dhaka" },
      emergencyContact: { name: "Spouse", phone: "+8801822222222" },
      acceptsSupportSessions: true,
      defaultMeetingUrl: "https://meet.google.com/staff",
      visibility: {
        phone: "HIDDEN",
        address: "HIDDEN",
        emergencyContact: "HIDDEN",
      },
      user: {
        id: staffUserId,
        firstName: "Kamal",
        lastName: "Hossain",
        email: "kamal@institute.edu",
        phone: "+8801833333333",
      },
    };

    it("strips hidden phone, address, and emergency contact for student viewer", async () => {
      const serialized = await serializeStaffForViewer(mockStaff, studentViewerCtx);

      expect(serialized.phone).toBeUndefined();
      expect(serialized.address).toBeUndefined();
      expect(serialized.emergencyContact).toBeUndefined();
      expect(serialized.user?.phone).toBeUndefined();
      expect(serialized.staffType).toBe("LIBRARIAN");
    });

    it("includes phone and emergency contact for the staff owner", async () => {
      const ownerCtx = { userId: staffUserId, instituteId };
      const serialized = await serializeStaffForViewer(mockStaff, ownerCtx);

      expect(serialized.phone).toBe("+8801811111111");
      expect(serialized.emergencyContact).toEqual({ name: "Spouse", phone: "+8801822222222" });
      expect(serialized.visibility).toBeDefined();
    });
  });

  // =========================================================================
  // 4. Institute Public Profile Serialization
  // =========================================================================
  describe("Institute Public Profile Serialization", () => {
    const mockInstitute = {
      id: instituteId,
      name: "Dhaka International Academy",
      legalName: "DIA Ltd.",
      code: "DIA",
      slug: "dia",
      email: "info@dia.edu",
      phone: "+8802999999",
      alternatePhone: "+8802888888",
      address: "Plot 10, Road 4, Dhanmondi",
      publicProfile: {
        about: "Leading international standard academy",
        mission: "Excellence in education",
        contactVisibility: {
          phone: "HIDDEN",
          email: "PUBLIC",
          address: "PUBLIC",
        },
      },
    };

    it("strips phone when contactVisibility.phone is HIDDEN", async () => {
      const serialized = await serializeInstituteForViewer(mockInstitute, studentViewerCtx);

      expect(serialized.phone).toBeUndefined();
      expect(serialized.alternatePhone).toBeUndefined();
      expect(serialized.email).toBe("info@dia.edu");
      expect(serialized.address).toBe("Plot 10, Road 4, Dhanmondi");
      expect(serialized.about).toBe("Leading international standard academy");
    });
  });

  // =========================================================================
  // 5. Visibility Updates & Audit Logging
  // =========================================================================
  describe("Visibility Updates", () => {
    it("updateTeacherVisibility updates teacher visibility and writes audit log", async () => {
      (prisma.teacherProfile.findFirst as any).mockResolvedValue({
        id: teacherProfileId,
        userId: teacherUserId,
        visibility: { phone: "MEMBERS" },
      });
      (prisma.teacherProfile.update as any).mockResolvedValue({
        id: teacherProfileId,
        visibility: { phone: "HIDDEN", email: "MEMBERS" },
      });

      const res = await updateTeacherVisibility(teacherOwnerCtx, {
        phone: "HIDDEN",
        email: "MEMBERS",
      });

      expect(res.success).toBe(true);
      expect(prisma.teacherProfile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: teacherProfileId },
          data: { visibility: { phone: "HIDDEN", email: "MEMBERS" } },
        }),
      );
      expect(auditModule.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "TEACHER_VISIBILITY_UPDATE",
          entityType: "TeacherProfile",
          entityId: teacherProfileId,
        }),
      );
    });

    it("updateInstituteContactVisibility upserts contactVisibility and writes audit log", async () => {
      (prisma.institutePublicProfile.findUnique as any).mockResolvedValue(null);
      (prisma.institutePublicProfile.upsert as any).mockResolvedValue({
        id: "pub-prof-1",
        instituteId,
        contactVisibility: { phone: "MEMBERS" },
      });

      const res = await updateInstituteContactVisibility(teacherOwnerCtx, {
        phone: "MEMBERS",
      });

      expect(res.success).toBe(true);
      expect(prisma.institutePublicProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { instituteId },
          create: { instituteId, contactVisibility: { phone: "MEMBERS" } },
        }),
      );
      expect(auditModule.logAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "INSTITUTE_CONTACT_VISIBILITY_UPDATE",
        }),
      );
    });
  });

  // =========================================================================
  // 6. Directory Service Endpoints Integration
  // =========================================================================
  describe("DirectoryService Integration", () => {
    it("getTeachersDirectory filters by subject and serializes output", async () => {
      const mockTeachers = [
        {
          id: "t1",
          userId: "u1",
          instituteId,
          headline: "Physics Teacher",
          officePhone: "+8801111",
          visibility: { phone: "HIDDEN" },
          user: { firstName: "Ali", lastName: "Ahmed" },
        },
      ];

      (prisma.teacherProfile.findMany as any).mockResolvedValue(mockTeachers);
      (prisma.teacherProfile.count as any).mockResolvedValue(1);

      const result = await DirectoryService.getTeachersDirectory(
        { subjectId: "sub-123" },
        { page: 1, limit: 10 },
        studentViewerCtx,
      );

      expect(result.data.length).toBe(1);
      // Serialized through serializeTeacherForViewer -> phone stripped
      expect(result.data[0].officePhone).toBeUndefined();
      expect(result.data[0].headline).toBe("Physics Teacher");
    });

    it("getTeacherById returns serialized teacher profile", async () => {
      const mockTeacher = {
        id: "t1",
        userId: "u1",
        instituteId,
        headline: "Math Teacher",
        publicEmail: "math@inst.edu",
        visibility: { email: "PUBLIC" },
      };

      (prisma.teacherProfile.findFirst as any).mockResolvedValue(mockTeacher);

      const result = await DirectoryService.getTeacherById("t1", studentViewerCtx);
      expect(result.headline).toBe("Math Teacher");
      expect(result.publicEmail).toBe("math@inst.edu");
    });

    it("getStaffDirectory serializes staff list", async () => {
      const mockStaffList = [
        {
          id: "s1",
          userId: "su1",
          instituteId,
          staffType: "ADMIN",
          phone: "+8802222",
          visibility: { phone: "HIDDEN" },
        },
      ];

      (prisma.staffProfile.findMany as any).mockResolvedValue(mockStaffList);
      (prisma.staffProfile.count as any).mockResolvedValue(1);

      const result = await DirectoryService.getStaffDirectory(
        {},
        { page: 1, limit: 10 },
        studentViewerCtx,
      );

      expect(result.data.length).toBe(1);
      expect(result.data[0].phone).toBeUndefined();
    });

    it("getInstitutePublicProfile returns serialized institute data", async () => {
      (prisma.institute.findUnique as any).mockResolvedValue({
        id: instituteId,
        name: "Test Academy",
        publicProfile: {
          about: "Test Academy About",
          contactVisibility: { email: "PUBLIC" },
        },
      });

      const result = await DirectoryService.getInstitutePublicProfile(studentViewerCtx);
      expect(result.name).toBe("Test Academy");
      expect(result.about).toBe("Test Academy About");
    });
  });
});
