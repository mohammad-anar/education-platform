import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  validateMeetingUrl,
  checkSupportOpenNow,
  isSupportOpenNow,
  getSupportSettings,
  updateSupportSettings,
  createTicket,
  listMyTickets,
  getMyTicket,
  addMessage,
  closeMyTicket,
  rateTicket,
  requestLiveSession,
  listAvailableSlots,
  bookSlot,
  cancelBooking,
  listTicketQueue,
  assignTicket,
  changeStatus,
  addInternalNote,
  publishAvailability,
  confirmSession,
  completeSession,
  resolveTicket,
} from "./support.service.js";
import prisma from "../../config/prisma.js";

vi.mock("../../config/prisma.js", () => ({
  default: {
    instituteSupportSetting: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    institute: {
      findUnique: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    supportTicket: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    supportTicketMessage: {
      create: vi.fn(),
    },
    supportAvailabilitySlot: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    supportSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    teacherProfile: {
      findFirst: vi.fn(),
    },
    staffProfile: {
      findFirst: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
    $queryRawUnsafe: vi.fn(),
  },
}));

vi.mock("../../utils/audit.js", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}));

describe("Step 8 - Support System Tests", () => {
  const mockCtx = {
    userId: "u-123",
    instituteId: "inst-123",
    studentId: "stud-123",
    scope: "OWN",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. MEETING URL VALIDATION TESTS
  // ==========================================
  describe("validateMeetingUrl", () => {
    it("should accept valid zoom.us URLs", () => {
      expect(validateMeetingUrl("https://zoom.us/j/123456789")).toBe(true);
      expect(validateMeetingUrl("https://us02web.zoom.us/j/987654321?pwd=abc")).toBe(true);
    });

    it("should accept valid meet.google.com URLs", () => {
      expect(validateMeetingUrl("https://meet.google.com/abc-defg-hij")).toBe(true);
    });

    it("should reject unauthorized or phishing domains", () => {
      expect(validateMeetingUrl("https://evil-phishing.com/zoom.us")).toBe(false);
      expect(validateMeetingUrl("https://zoom.us.malicious.net/join")).toBe(false);
      expect(validateMeetingUrl("https://discord.gg/invite")).toBe(false);
    });

    it("should reject malformed URLs", () => {
      expect(validateMeetingUrl("not-a-url")).toBe(false);
      expect(validateMeetingUrl("")).toBe(false);
    });

    it("should support custom allowed domain lists", () => {
      const customDomains = ["teams.microsoft.com", "myedu.customdomain.org"];
      expect(validateMeetingUrl("https://teams.microsoft.com/l/meetup-join", customDomains)).toBe(true);
      expect(validateMeetingUrl("https://sub.myedu.customdomain.org/room/1", customDomains)).toBe(true);
      expect(validateMeetingUrl("https://zoom.us/j/123", customDomains)).toBe(false);
    });
  });

  // ==========================================
  // 2. TIMEZONE-AWARE CLOSED-HOURS TESTS (Acceptance Gate)
  // ==========================================
  describe("checkSupportOpenNow & Closed-Hours Acceptance", () => {
    it("should return false when master switch isOpen is false", () => {
      const settings = {
        isOpen: false,
        timezone: "Asia/Dhaka",
        openHours: {
          monday: { isOpen: true, start: "00:00", end: "23:59" },
        },
      };
      expect(checkSupportOpenNow(settings)).toBe(false);
    });

    it("should return true when isOpen is true and openHours is unconfigured", () => {
      const settings = {
        isOpen: true,
        timezone: "UTC",
        openHours: null,
      };
      expect(checkSupportOpenNow(settings)).toBe(true);
    });

    it("should return false when the current day is explicitly closed", () => {
      // Find today's day name in UTC
      const now = new Date();
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const today = dayNames[now.getUTCDay()];

      const settings = {
        isOpen: true,
        timezone: "UTC",
        openHours: {
          [today]: { isOpen: false, start: "09:00", end: "17:00" },
        },
      };
      expect(checkSupportOpenNow(settings)).toBe(false);
    });

    it("should return false when current time is outside the open hours window", () => {
      const now = new Date();
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const today = dayNames[now.getUTCDay()];

      // Schedule window configured for the far future of the day (e.g. 23:58 to 23:59)
      // or past (00:01 to 00:02) unless current time exactly matches
      const currentUtcHours = now.getUTCHours();
      const outsideStart = currentUtcHours > 12 ? "01:00" : "22:00";
      const outsideEnd = currentUtcHours > 12 ? "02:00" : "23:00";

      const settings = {
        isOpen: true,
        timezone: "UTC",
        openHours: {
          [today]: { isOpen: true, start: outsideStart, end: outsideEnd },
        },
      };
      expect(checkSupportOpenNow(settings)).toBe(false);
    });

    it("should return true when current time is within open hours window", () => {
      const now = new Date();
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const today = dayNames[now.getUTCDay()];

      const settings = {
        isOpen: true,
        timezone: "UTC",
        openHours: {
          [today]: { isOpen: true, start: "00:00", end: "23:59" },
        },
      };
      expect(checkSupportOpenNow(settings)).toBe(true);
    });

    it("should throw BAD_REQUEST when requesting live session during closed hours", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stud-123" });
      (prisma.supportTicket.findFirst as any).mockResolvedValue({
        id: "tkt-123",
        ticketNumber: "TKT-001",
      });
      // Mock support desk closed
      (prisma.instituteSupportSetting.findUnique as any).mockResolvedValue({
        id: "set-1",
        instituteId: "inst-123",
        isOpen: false,
        allowLiveSession: true,
      });

      await expect(
        requestLiveSession(mockCtx, "tkt-123", { notes: "Urgent help needed" })
      ).rejects.toThrow(/Support desk is currently closed/);
    });

    it("should throw BAD_REQUEST when live sessions are disabled by policy", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stud-123" });
      (prisma.supportTicket.findFirst as any).mockResolvedValue({
        id: "tkt-123",
        ticketNumber: "TKT-001",
      });
      (prisma.instituteSupportSetting.findUnique as any).mockResolvedValue({
        id: "set-1",
        instituteId: "inst-123",
        isOpen: true,
        allowLiveSession: false,
      });

      await expect(
        requestLiveSession(mockCtx, "tkt-123", { notes: "Help" })
      ).rejects.toThrow(/Live support sessions are currently disabled/);
    });
  });

  // ==========================================
  // 3. DOUBLE-BOOKING ROW-LOCK TESTS (Acceptance Gate)
  // ==========================================
  describe("bookSlot & Double-Booking Prevention Acceptance", () => {
    it("should successfully book an available slot", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stud-123" });
      // Simulate PostgreSQL row lock returning slot
      (prisma.$queryRawUnsafe as any).mockResolvedValue([
        {
          id: "slot-1",
          instituteId: "inst-123",
          userId: "teacher-1",
          startTime: new Date("2026-10-20T10:00:00Z"),
          endTime: new Date("2026-10-20T10:30:00Z"),
          isBooked: false,
          status: "AVAILABLE",
          version: 1,
        },
      ]);
      (prisma.supportTicket.findFirst as any).mockResolvedValue({
        id: "tkt-1",
        ticketNumber: "TKT-100",
        studentId: "stud-123",
      });
      (prisma.supportAvailabilitySlot.update as any).mockResolvedValue({
        id: "slot-1",
        isBooked: true,
        status: "BOOKED",
      });
      (prisma.supportSession.create as any).mockResolvedValue({
        id: "sess-1",
        slotId: "slot-1",
        ticketId: "tkt-1",
        status: "SCHEDULED",
        hostUserId: "teacher-1",
      });

      const session = await bookSlot(mockCtx, {
        slotId: "slot-1",
        ticketId: "tkt-1",
      });

      expect(session).toBeDefined();
      expect(session.id).toBe("sess-1");
      expect(prisma.supportAvailabilitySlot.update).toHaveBeenCalledWith({
        where: { id: "slot-1" },
        data: {
          isBooked: true,
          status: "BOOKED",
          version: { increment: 1 },
        },
      });
    });

    it("should reject and throw CONFLICT when slot is already booked (double-booking prevention)", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stud-123" });
      // Simulate locked slot already marked booked
      (prisma.$queryRawUnsafe as any).mockResolvedValue([
        {
          id: "slot-1",
          instituteId: "inst-123",
          userId: "teacher-1",
          startTime: new Date("2026-10-20T10:00:00Z"),
          endTime: new Date("2026-10-20T10:30:00Z"),
          isBooked: true,
          status: "BOOKED",
          version: 2,
        },
      ]);

      await expect(
        bookSlot(mockCtx, {
          slotId: "slot-1",
          ticketId: "tkt-1",
        })
      ).rejects.toThrow(/already been booked/);

      expect(prisma.supportSession.create).not.toHaveBeenCalled();
    });

    it("should reject when slot does not exist", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stud-123" });
      (prisma.$queryRawUnsafe as any).mockResolvedValue([]);

      await expect(
        bookSlot(mockCtx, {
          slotId: "slot-non-existent",
          ticketId: "tkt-1",
        })
      ).rejects.toThrow(/Availability slot not found/);
    });
  });

  // ==========================================
  // 4. TICKET LIFECYCLE & PRIVACY TESTS
  // ==========================================
  describe("Ticket Lifecycle & Privacy Guardrails", () => {
    it("should create ticket and generate unique ticketNumber", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stud-123" });
      (prisma.supportTicket.create as any).mockImplementation(({ data }: any) => ({
        id: "tkt-new",
        ...data,
      }));

      const ticket = await createTicket(mockCtx, {
        subject: "Cannot access course module 3",
        description: "Error 403 on opening lesson",
        priority: "HIGH",
      });

      expect(ticket.id).toBe("tkt-new");
      expect(ticket.ticketNumber).toMatch(/^TKT-\d+-\d+$/);
      expect(ticket.status).toBe("OPEN");
    });

    it("should strip internal notes from student view in getMyTicket", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stud-123" });
      (prisma.supportTicket.findFirst as any).mockResolvedValue({
        id: "tkt-1",
        subject: "Billing question",
        messages: [
          { id: "m-1", message: "Student asks question", isInternalNote: false },
        ],
      });

      const ticket = await getMyTicket(mockCtx, "tkt-1");
      expect(ticket).toBeDefined();
      expect(prisma.supportTicket.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            messages: expect.objectContaining({
              where: { isInternalNote: false },
            }),
          }),
        })
      );
    });

    it("should record an internal note visible only to staff", async () => {
      (prisma.supportTicket.findFirst as any).mockResolvedValue({
        id: "tkt-1",
        instituteId: "inst-123",
      });
      (prisma.supportTicketMessage.create as any).mockResolvedValue({
        id: "m-note",
        ticketId: "tkt-1",
        message: "Escalated to billing department",
        isInternalNote: true,
      });

      const note = await addInternalNote(mockCtx, "tkt-1", {
        note: "Escalated to billing department",
      });

      expect(note.isInternalNote).toBe(true);
      expect(prisma.supportTicketMessage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isInternalNote: true,
          }),
        })
      );
    });

    it("should rate a ticket resolution with feedback", async () => {
      (prisma.student.findFirst as any).mockResolvedValue({ id: "stud-123" });
      (prisma.supportTicket.findFirst as any).mockResolvedValue({
        id: "tkt-1",
        status: "RESOLVED",
      });
      (prisma.supportTicket.update as any).mockResolvedValue({
        id: "tkt-1",
        rating: 5,
        ratingFeedback: "Excellent and fast support!",
      });

      const rated = await rateTicket(mockCtx, "tkt-1", {
        rating: 5,
        ratingFeedback: "Excellent and fast support!",
      });

      expect(rated.rating).toBe(5);
    });

    it("should reject session confirmation with invalid meeting URL", async () => {
      (prisma.supportSession.findFirst as any).mockResolvedValue({
        id: "sess-1",
        instituteId: "inst-123",
        ticket: { ticketNumber: "TKT-101" },
        student: { userId: "u-stud" },
      });
      (prisma.instituteSupportSetting.findUnique as any).mockResolvedValue({
        instituteId: "inst-123",
        allowedMeetingDomains: ["zoom.us", "meet.google.com"],
      });

      await expect(
        confirmSession(mockCtx, "sess-1", {
          meetingUrl: "https://suspicious-domain.xyz/meeting",
        })
      ).rejects.toThrow(/Meeting URL domain is not allowed/);
    });

    it("should confirm session with authorized meeting URL", async () => {
      (prisma.supportSession.findFirst as any).mockResolvedValue({
        id: "sess-1",
        instituteId: "inst-123",
        ticket: { ticketNumber: "TKT-101" },
        student: { userId: "u-stud" },
      });
      (prisma.instituteSupportSetting.findUnique as any).mockResolvedValue({
        instituteId: "inst-123",
        allowedMeetingDomains: ["zoom.us", "meet.google.com"],
        defaultProvider: "GOOGLE_MEET",
      });
      (prisma.supportSession.update as any).mockResolvedValue({
        id: "sess-1",
        meetingUrl: "https://meet.google.com/xyz-abcd-efg",
        status: "SCHEDULED",
      });

      const confirmed = await confirmSession(mockCtx, "sess-1", {
        meetingUrl: "https://meet.google.com/xyz-abcd-efg",
      });

      expect(confirmed.status).toBe("SCHEDULED");
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it("should cancel booking and release availability slot", async () => {
      (prisma.supportSession.findFirst as any).mockResolvedValue({
        id: "sess-1",
        instituteId: "inst-123",
        slotId: "slot-1",
        status: "SCHEDULED",
      });
      (prisma.supportAvailabilitySlot.update as any).mockResolvedValue({
        id: "slot-1",
        isBooked: false,
        status: "AVAILABLE",
      });
      (prisma.supportSession.update as any).mockResolvedValue({
        id: "sess-1",
        status: "CANCELLED",
      });

      const cancelled = await cancelBooking(mockCtx, "sess-1", "Conflict in schedule");
      expect(cancelled.status).toBe("CANCELLED");
      expect(prisma.supportAvailabilitySlot.update).toHaveBeenCalledWith({
        where: { id: "slot-1" },
        data: {
          isBooked: false,
          status: "AVAILABLE",
        },
      });
    });
  });
});
