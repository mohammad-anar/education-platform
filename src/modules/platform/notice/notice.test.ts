import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  createNotice,
  updateNotice,
  publishNotice,
  unpublishNotice,
  pinNotice,
  deleteNotice,
  resolveAudienceUsers,
  listMyNotices,
  markRead,
  getUnreadCount,
  getNoticeReadStats,
  fanOutNoticeNotifications,
} from "./notice.service.js";
import prisma from "../../../config/prisma.js";

vi.mock("../../../config/prisma.js", () => ({
  default: {
    notice: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    noticeAudience: {
      deleteMany: vi.fn(),
    },
    noticeRead: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    instituteMembership: {
      findMany: vi.fn(),
    },
    userRole: {
      findMany: vi.fn(),
    },
    role: {
      findFirst: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    studentAcademicEnrollment: {
      findMany: vi.fn(),
    },
    courseEnrollment: {
      findMany: vi.fn(),
    },
    notification: {
      createMany: vi.fn(),
    },
  },
}));

vi.mock("../../../utils/audit.js", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("Step 9 - Notice Board Tests", () => {
  const mockCtx = {
    userId: "user-student-8A",
    instituteId: "inst-1",
    studentId: "student-8A",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. ACCEPTANCE GATE: CLASS AUDIENCE ISOLATION
  // ==========================================
  describe("Audience Isolation Acceptance Gate", () => {
    it("student of Class 8-A does not see a notice targeted to Class 9", async () => {
      // 1. Mock student profile for user-student-8A
      (prisma.student.findFirst as any).mockResolvedValue({ id: "student-8A" });

      // Student 8-A is enrolled in Class 8, Section A
      (prisma.studentAcademicEnrollment.findMany as any).mockResolvedValue([
        {
          studentId: "student-8A",
          classGroupId: "class-8-id",
          sectionId: "section-8A-id",
          programId: "prog-middle-school",
          classGroup: { levelId: "level-grade-8" },
        },
      ]);
      (prisma.courseEnrollment.findMany as any).mockResolvedValue([
        { courseId: "course-general-math" },
      ]);
      (prisma.userRole.findMany as any).mockResolvedValue([
        { role: { id: "role-student-id", code: "STUDENT" } },
      ]);

      // Notice for Class 9: audiences = [{ type: 'CLASS', targetId: 'class-9-id' }]
      // When prisma.notice.findMany executes with the audience condition,
      // the where filter will enforce { audiences: { some: { OR: [audienceConditions] } } }
      // The student's audienceConditions only contains class-8-id, not class-9-id.
      (prisma.notice.findMany as any).mockImplementation(({ where }: any) => {
        // Evaluate audience matching simulating database query
        const noticeForClass9 = {
          id: "notice-class-9",
          title: "Grade 9 Registration Details",
          content: "Specific information for class 9 students only.",
          audiences: [{ type: "CLASS", targetId: "class-9-id" }],
          reads: [],
        };

        const noticeForClass8 = {
          id: "notice-class-8",
          title: "Grade 8 Field Trip",
          content: "Trip details for class 8.",
          audiences: [{ type: "CLASS", targetId: "class-8-id" }],
          reads: [],
        };

        const noticeForWholeInstitute = {
          id: "notice-all",
          title: "Winter Vacation Announcement",
          content: "All students please note vacation starts next week.",
          audiences: [],
          reads: [],
        };

        const allCandidateNotices = [noticeForClass9, noticeForClass8, noticeForWholeInstitute];

        // Filter Candidate notices according to the audience criteria in `where`
        const filtered = allCandidateNotices.filter((n) => {
          if (n.audiences.length === 0) return true; // whole institute
          return n.audiences.some((aud) => {
            return where.AND?.some((andClause: any) =>
              andClause.OR?.some((orClause: any) => {
                if (orClause.audiences?.some?.OR) {
                  return orClause.audiences.some.OR.some((cond: any) => {
                    if (cond.type === aud.type) {
                      if (!cond.targetId) return true;
                      if (cond.targetId.in) return cond.targetId.in.includes(aud.targetId);
                      return cond.targetId === aud.targetId;
                    }
                    return false;
                  });
                }
                return false;
              })
            );
          });
        });

        return filtered;
      });

      const result = await listMyNotices(mockCtx, {});

      // Verify that Grade 8 notice and Whole Institute notice appear,
      // but Grade 9 notice is strictly excluded!
      const noticeIds = result.data.map((n) => n.id);
      expect(noticeIds).toContain("notice-class-8");
      expect(noticeIds).toContain("notice-all");
      expect(noticeIds).not.toContain("notice-class-9");
    });
  });

  // ==========================================
  // 2. AUDIENCE RESOLUTION TESTS
  // ==========================================
  describe("resolveAudienceUsers", () => {
    it("should resolve whole institute when audiences list is empty", async () => {
      (prisma.instituteMembership.findMany as any).mockResolvedValue([
        { userId: "u-1" },
        { userId: "u-2" },
        { userId: "u-3" },
      ]);

      const userIds = await resolveAudienceUsers({
        instituteId: "inst-1",
        audiences: [],
      });

      expect(userIds).toEqual(["u-1", "u-2", "u-3"]);
    });

    it("should resolve specific users and sections correctly", async () => {
      (prisma.studentAcademicEnrollment.findMany as any).mockResolvedValue([
        { student: { userId: "u-student-1" } },
        { student: { userId: "u-student-2" } },
      ]);

      const userIds = await resolveAudienceUsers({
        instituteId: "inst-1",
        audiences: [
          { type: "USER", targetId: "u-teacher-1" },
          { type: "SECTION", targetId: "sec-1" },
        ],
      });

      expect(userIds).toContain("u-teacher-1");
      expect(userIds).toContain("u-student-1");
      expect(userIds).toContain("u-student-2");
    });
  });

  // ==========================================
  // 3. NOTICE LIFECYCLE & PINNING TESTS
  // ==========================================
  describe("Notice Lifecycle & Management", () => {
    it("should create notice and fan-out notifications on immediate publish", async () => {
      const mockCreated = {
        id: "notice-new",
        instituteId: "inst-1",
        title: "Midterm Schedule Released",
        content: "Please check your portal for exam routines.",
        publishAt: new Date(),
        audiences: [],
      };
      (prisma.notice.create as any).mockResolvedValue(mockCreated);
      (prisma.instituteMembership.findMany as any).mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ]);

      const notice = await createNotice(
        {
          title: "Midterm Schedule Released",
          content: "Please check your portal for exam routines.",
          publishNow: true,
        },
        mockCtx
      );

      expect(notice.id).toBe("notice-new");
      expect(prisma.notification.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              type: "NOTICE",
              title: "Notice: Midterm Schedule Released",
            }),
          ]),
        })
      );
    });

    it("should update notice fields and replace audiences", async () => {
      (prisma.notice.findFirst as any).mockResolvedValue({
        id: "notice-1",
        instituteId: "inst-1",
        title: "Old Title",
      });
      (prisma.notice.update as any).mockResolvedValue({
        id: "notice-1",
        title: "Updated Title",
        pinned: true,
      });

      const updated = await updateNotice(
        "notice-1",
        {
          title: "Updated Title",
          pinned: true,
          audiences: [{ type: "ROLE", targetId: "TEACHER" }],
        },
        mockCtx
      );

      expect(updated.title).toBe("Updated Title");
      expect(prisma.noticeAudience.deleteMany).toHaveBeenCalledWith({
        where: { noticeId: "notice-1" },
      });
    });

    it("should pin and unpin notice", async () => {
      (prisma.notice.findFirst as any).mockResolvedValue({
        id: "notice-1",
        instituteId: "inst-1",
        pinned: false,
      });
      (prisma.notice.update as any).mockResolvedValue({
        id: "notice-1",
        pinned: true,
      });

      const pinned = await pinNotice("notice-1", true, mockCtx);
      expect(pinned.pinned).toBe(true);
      expect(prisma.notice.update).toHaveBeenCalledWith({
        where: { id: "notice-1" },
        data: { pinned: true },
      });
    });

    it("should soft delete notice", async () => {
      (prisma.notice.findFirst as any).mockResolvedValue({
        id: "notice-1",
        instituteId: "inst-1",
      });
      (prisma.notice.update as any).mockResolvedValue({
        id: "notice-1",
        status: "DELETED",
        deletedAt: new Date(),
      });

      const deleted = await deleteNotice("notice-1", mockCtx);
      expect(deleted.status).toBe("DELETED");
      expect(deleted.deletedAt).toBeDefined();
    });
  });

  // ==========================================
  // 4. READ TRACKING & ENGAGEMENT STATS
  // ==========================================
  describe("Read Tracking & Engagement Statistics", () => {
    it("should mark notice as read via upsert", async () => {
      (prisma.notice.findFirst as any).mockResolvedValue({
        id: "notice-1",
        instituteId: "inst-1",
      });
      (prisma.noticeRead.upsert as any).mockResolvedValue({
        noticeId: "notice-1",
        userId: mockCtx.userId,
        readAt: new Date(),
      });

      const read = await markRead(mockCtx, "notice-1");
      expect(read.noticeId).toBe("notice-1");
      expect(prisma.noticeRead.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            noticeId_userId: {
              noticeId: "notice-1",
              userId: mockCtx.userId,
            },
          },
        })
      );
    });

    it("should compute notice read statistics for admin audit", async () => {
      (prisma.notice.findFirst as any).mockResolvedValue({
        id: "notice-1",
        title: "Annual Sports Day Notice",
        instituteId: "inst-1",
        audiences: [],
      });
      // 4 targeted users in total
      (prisma.instituteMembership.findMany as any).mockResolvedValue([
        { userId: "u-1" },
        { userId: "u-2" },
        { userId: "u-3" },
        { userId: "u-4" },
      ]);
      // 2 users have read the notice
      (prisma.noticeRead.findMany as any).mockResolvedValue([
        {
          userId: "u-1",
          readAt: new Date("2026-10-15T10:00:00Z"),
          user: { firstName: "Alice", email: "alice@school.edu" },
        },
        {
          userId: "u-2",
          readAt: new Date("2026-10-15T10:05:00Z"),
          user: { firstName: "Bob", email: "bob@school.edu" },
        },
      ]);

      const stats = await getNoticeReadStats("notice-1", mockCtx);
      expect(stats.totalTargeted).toBe(4);
      expect(stats.totalRead).toBe(2);
      expect(stats.readPercentage).toBe(50.0);
      expect(stats.reads.length).toBe(2);
    });

    it("should return unread count for current user", async () => {
      (prisma.student.findFirst as any).mockResolvedValue(null);
      (prisma.userRole.findMany as any).mockResolvedValue([]);
      (prisma.notice.findMany as any).mockResolvedValue([
        { id: "notice-1", title: "N1", reads: [] },
        { id: "notice-2", title: "N2", reads: [] },
      ]);

      const result = await getUnreadCount(mockCtx);
      expect(result.unreadCount).toBe(2);
    });
  });
});
