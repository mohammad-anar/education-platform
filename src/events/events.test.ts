import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import prisma from "../config/prisma.js";
import { DomainEventEmitter } from "./event-emitter.js";
import { DomainEventType } from "./event-types.js";
import { notificationsQueue } from "../queues/notification.queue.js";
import { reportsQueue } from "../queues/report.queue.js";
import { rollupsQueue } from "../queues/rollup.queue.js";
import cacheHelper from "../utils/cache.js";
import { scheduleRepeatableJobs } from "../jobs/schedulers.js";

// Mock dependencies
vi.mock("../config/prisma.js", () => {
  return {
    default: {
      analyticsEvent: {
        create: vi.fn(),
        createMany: vi.fn(),
      },
      notification: {
        create: vi.fn(),
        createMany: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
      },
      assessment: {
        findMany: vi.fn(),
      },
      courseEnrollment: {
        findMany: vi.fn(),
        groupBy: vi.fn(),
      },
      subscription: {
        findMany: vi.fn(),
      },
      institute: {
        findMany: vi.fn(),
        count: vi.fn(),
      },
      student: {
        count: vi.fn(),
      },
      teacherProfile: {
        count: vi.fn(),
      },
      course: {
        count: vi.fn(),
      },
      attendanceRecord: {
        groupBy: vi.fn(),
      },
    },
  };
});

vi.mock("../queues/notification.queue.js", () => ({
  NOTIFICATIONS_QUEUE_NAME: "notifications",
  notificationsQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-123" }),
    upsertJobScheduler: vi.fn().mockResolvedValue({ id: "scheduler-123" }),
  },
}));

vi.mock("../queues/report.queue.js", () => ({
  REPORTS_QUEUE_NAME: "reports",
  reportsQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-report-123" }),
    upsertJobScheduler: vi.fn().mockResolvedValue({ id: "scheduler-report-123" }),
  },
}));

vi.mock("../queues/rollup.queue.js", () => ({
  ROLLUPS_QUEUE_NAME: "rollups",
  rollupsQueue: {
    add: vi.fn().mockResolvedValue({ id: "job-rollup-123" }),
    upsertJobScheduler: vi.fn().mockResolvedValue({ id: "scheduler-rollup-123" }),
  },
}));

vi.mock("../utils/cache.js", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn().mockResolvedValue(true),
    del: vi.fn(),
  },
}));

describe("Step 13 - Domain Events, Queues, Workers & Repeatable Schedulers", () => {
  let emitter: DomainEventEmitter;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = new DomainEventEmitter();
  });

  describe("Domain Event Emitter & Analytics Persistence", () => {
    it("should emit event to synchronous listeners and persist to AnalyticsEvent table", async () => {
      const listener = vi.fn();
      emitter.on(DomainEventType.LOGIN, listener);

      (prisma.analyticsEvent.create as any).mockResolvedValue({
        id: "event-1",
        eventType: DomainEventType.LOGIN,
        actorId: "user-1",
        instituteId: "inst-1",
        entityType: "User",
        entityId: "user-1",
        properties: { ip: "127.0.0.1" },
        occurredAt: new Date(),
      });

      const payload = {
        instituteId: "inst-1",
        actorId: "user-1",
        eventType: DomainEventType.LOGIN,
        entityType: "User",
        entityId: "user-1",
        properties: { ip: "127.0.0.1" },
      };

      const result = await emitter.emitEvent(payload);

      expect(listener).toHaveBeenCalledWith(payload);
      expect(prisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          instituteId: "inst-1",
          actorId: "user-1",
          eventType: DomainEventType.LOGIN,
          entityType: "User",
          entityId: "user-1",
          properties: { ip: "127.0.0.1" },
        }),
      });
      expect(result.id).toBe("event-1");
    });

    it("should gracefully handle database failures without throwing or blocking", async () => {
      (prisma.analyticsEvent.create as any).mockRejectedValue(new Error("Database connection lost"));

      const payload = {
        eventType: DomainEventType.ENROLLMENT_BANNED,
        actorId: "admin-1",
        entityId: "enrollment-1",
        properties: { reason: "Policy violation" },
      };

      // Must not reject
      await expect(emitter.emitEvent(payload)).resolves.toBeNull();
    });

    it("should automatically route NOTICE_PUBLISHED events to notificationsQueue", async () => {
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: "event-2" });

      await emitter.emitEvent({
        instituteId: "inst-1",
        actorId: "admin-1",
        eventType: DomainEventType.NOTICE_PUBLISHED,
        entityType: "Notice",
        entityId: "notice-1",
        properties: { title: "Exam Schedule", content: "Details..." },
      });

      expect(notificationsQueue.add).toHaveBeenCalledWith(
        "notice_fanout",
        expect.objectContaining({
          noticeId: "notice-1",
          instituteId: "inst-1",
          title: "Exam Schedule",
          content: "Details...",
          createdById: "admin-1",
        }),
        expect.objectContaining({ jobId: "notice:notice-1" }),
      );
    });

    it("should automatically route TICKET_CREATED with assigned agent to direct notification job", async () => {
      (prisma.analyticsEvent.create as any).mockResolvedValue({ id: "event-3" });

      await emitter.emitEvent({
        instituteId: "inst-1",
        actorId: "student-1",
        eventType: DomainEventType.TICKET_CREATED,
        entityType: "SupportTicket",
        entityId: "ticket-1",
        properties: {
          ticketNumber: "TCK-1001",
          subject: "Cannot access exam",
          assignedToUserId: "agent-1",
        },
      });

      expect(notificationsQueue.add).toHaveBeenCalledWith(
        "direct_notification",
        expect.objectContaining({
          userId: "agent-1",
          instituteId: "inst-1",
          type: "SUPPORT",
          data: { ticketId: "ticket-1" },
        }),
      );
    });
  });

  describe("Video Heartbeat High-Throughput Batching", () => {
    it("should buffer video heartbeats and flush them in bulk using createMany", async () => {
      (prisma.analyticsEvent.createMany as any).mockResolvedValue({ count: 2 });

      emitter.emitVideoHeartbeat({
        instituteId: "inst-1",
        actorId: "student-1",
        eventType: DomainEventType.VIDEO_HEARTBEAT,
        entityId: "video-1",
        properties: { lessonId: "l-1", currentPlaybackSeconds: 30 },
      });

      emitter.emitVideoHeartbeat({
        instituteId: "inst-1",
        actorId: "student-1",
        eventType: DomainEventType.VIDEO_HEARTBEAT,
        entityId: "video-1",
        properties: { lessonId: "l-1", currentPlaybackSeconds: 40 },
      });

      // Explicitly flush
      const flushedCount = await emitter.flushVideoHeartbeats();

      expect(flushedCount).toBe(2);
      expect(prisma.analyticsEvent.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            instituteId: "inst-1",
            actorId: "student-1",
            eventType: DomainEventType.VIDEO_HEARTBEAT,
            entityId: "video-1",
          }),
        ]),
      });

      // Second flush should be empty
      const secondFlush = await emitter.flushVideoHeartbeats();
      expect(secondFlush).toBe(0);
    });

    it("should auto-flush when buffer reaches batch threshold (25)", async () => {
      (prisma.analyticsEvent.createMany as any).mockResolvedValue({ count: 25 });

      for (let i = 0; i < 25; i++) {
        emitter.emitVideoHeartbeat({
          instituteId: "inst-1",
          actorId: `student-${i}`,
          eventType: DomainEventType.VIDEO_HEARTBEAT,
          entityId: "video-1",
          properties: { currentPlaybackSeconds: i * 5 },
        });
      }

      // Allow microtask to process flush triggered at 25
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(prisma.analyticsEvent.createMany).toHaveBeenCalled();
    });
  });

  describe("Repeatable Job Schedulers", () => {
    it("should register repeatable jobs for attendance rollup, subscription expiry, and overdue items", async () => {
      await scheduleRepeatableJobs();

      // Check rollupsQueue scheduler
      expect(
        (rollupsQueue.upsertJobScheduler as any) || (rollupsQueue.add as any),
      ).toHaveBeenCalled();

      // Check notificationsQueue schedulers (expiry + overdue)
      expect(
        (notificationsQueue.upsertJobScheduler as any) || (notificationsQueue.add as any),
      ).toHaveBeenCalledTimes(2);
    });
  });
});
