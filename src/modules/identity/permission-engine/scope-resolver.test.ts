import { describe, it, expect, beforeEach, vi } from "vitest";
import prisma from "../../../config/prisma.js";
import { resolveAssignedScope, buildScopeWhere } from "./scope-resolver.js";
import * as evaluator from "./permission-evaluator.js";

vi.mock("../../../config/prisma.js", () => ({
  default: {
    courseTeacher: {
      findMany: vi.fn(),
    },
    classTeacher: {
      findMany: vi.fn(),
    },
    section: {
      findMany: vi.fn(),
    },
    studentGuardian: {
      findMany: vi.fn(),
    },
    courseEnrollment: {
      findMany: vi.fn(),
    },
  },
}));

describe("Scope Resolver: resolveAssignedScope & buildScopeWhere", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("resolveAssignedScope", () => {
    const ctx = { userId: "teacher-1", instituteId: "inst-1" };

    it("resolves course IDs for course resource", async () => {
      (prisma as any).courseTeacher.findMany.mockResolvedValue([
        { courseId: "course-1" },
        { courseId: "course-2" },
      ]);

      const ids = await resolveAssignedScope(ctx, "course");
      expect(ids).toEqual(["course-1", "course-2"]);
    });

    it("resolves classGroup IDs for class resource", async () => {
      (prisma as any).classTeacher.findMany.mockResolvedValue([
        { classGroupId: "cg-1" },
      ]);

      const ids = await resolveAssignedScope(ctx, "classGroup");
      expect(ids).toEqual(["cg-1"]);
    });

    it("resolves section IDs for section resource", async () => {
      (prisma as any).section.findMany.mockResolvedValue([
        { id: "sec-1" },
        { id: "sec-2" },
      ]);

      const ids = await resolveAssignedScope(ctx, "section");
      expect(ids).toEqual(["sec-1", "sec-2"]);
    });

    it("resolves student IDs for student resource (guardian wards + enrolled students)", async () => {
      (prisma as any).studentGuardian.findMany.mockResolvedValue([
        { studentId: "std-ward-1" },
      ]);
      (prisma as any).courseEnrollment.findMany.mockResolvedValue([
        { studentId: "std-course-1" },
      ]);

      const ids = await resolveAssignedScope(ctx, "student");
      expect(ids).toContain("std-ward-1");
      expect(ids).toContain("std-course-1");
    });

    it("returns empty array when userId is missing", async () => {
      const ids = await resolveAssignedScope({ userId: "" }, "course");
      expect(ids).toEqual([]);
    });
  });

  describe("buildScopeWhere", () => {
    const ctx = { userId: "user-1", instituteId: "inst-1" };

    it("returns impossible filter when permission decision is disallowed", async () => {
      vi.spyOn(evaluator, "can").mockResolvedValue({ allowed: false, reason: "PERMISSION_NOT_GRANTED" });

      const where = await buildScopeWhere(ctx, "lms.course.update", "Course");
      expect(where).toEqual({ id: "00000000-0000-0000-0000-000000000000" });
    });

    it("returns tenant filter when scope is INSTITUTE", async () => {
      vi.spyOn(evaluator, "can").mockResolvedValue({ allowed: true, scope: "INSTITUTE" });

      const where = await buildScopeWhere(ctx, "academic.course.read", "Course");
      expect(where).toEqual({ instituteId: "inst-1" });
    });

    it("returns assigned IDs filter when scope is ASSIGNED", async () => {
      vi.spyOn(evaluator, "can").mockResolvedValue({ allowed: true, scope: "ASSIGNED" });
      (prisma as any).courseTeacher.findMany.mockResolvedValue([{ courseId: "c-1" }]);

      const where = await buildScopeWhere(ctx, "lms.course.read", "course");
      expect(where).toEqual({
        instituteId: "inst-1",
        id: { in: ["c-1"] },
      });
    });

    it("returns owner filter when scope is OWN", async () => {
      vi.spyOn(evaluator, "can").mockResolvedValue({ allowed: true, scope: "OWN" });

      const where = await buildScopeWhere(ctx, "platform.notification.read", "Notification");
      expect(where).toEqual({ userId: "user-1" });
    });

    it("returns global filter without tenant restriction when scope is ALL", async () => {
      vi.spyOn(evaluator, "can").mockResolvedValue({ allowed: true, scope: "ALL" });

      const where = await buildScopeWhere({ userId: "admin-1" }, "saas.institute.read", "Institute");
      expect(where).toEqual({});
    });
  });
});
