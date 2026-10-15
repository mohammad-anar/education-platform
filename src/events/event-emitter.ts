import { EventEmitter } from "node:events";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import { DomainEventType, IDomainEventPayload } from "./event-types.js";
import { notificationsQueue } from "../queues/notification.queue.js";

export class DomainEventEmitter extends EventEmitter {
  private videoHeartbeatBuffer: IDomainEventPayload[] = [];
  private readonly maxBatchSize = 25;
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    super();
    // Start periodic background flush for batched heartbeats
    this.flushTimer = setInterval(() => {
      this.flushVideoHeartbeats().catch((err) => {
        logger.error(`Error in periodic heartbeat flush: ${err.message}`);
      });
    }, 5000);

    // Ensure timer doesn't prevent Node process exit
    if (this.flushTimer && typeof this.flushTimer.unref === "function") {
      this.flushTimer.unref();
    }
  }

  /**
   * Emits a domain event, persists an AnalyticsEvent record in the database,
   * and dispatches associated queue jobs.
   *
   * @param {IDomainEventPayload} payload - The domain event payload.
   * @returns {Promise<any>} Created AnalyticsEvent record.
   */
  public async emitEvent(payload: IDomainEventPayload): Promise<any> {
    const occurredAt = payload.occurredAt || new Date();

    // 1. Emit synchronously to in-memory listeners
    this.emit(payload.eventType, payload);
    this.emit("*", payload);

    // 2. Persist AnalyticsEvent row asynchronously
    let savedEvent: any = null;
    try {
      savedEvent = await prisma.analyticsEvent.create({
        data: {
          instituteId: payload.instituteId || undefined,
          actorId: payload.actorId || undefined,
          eventType: payload.eventType,
          entityType: payload.entityType || undefined,
          entityId: payload.entityId || undefined,
          properties: payload.properties ? (payload.properties as any) : undefined,
          occurredAt,
        },
      });
    } catch (error: any) {
      logger.error(`Failed to persist AnalyticsEvent for ${payload.eventType}: ${error.message}`);
    }

    // 3. Trigger BullMQ queue workflows based on event type
    try {
      await this.routeEventToQueues(payload);
    } catch (queueError: any) {
      logger.error(`Failed to enqueue job for event ${payload.eventType}: ${queueError.message}`);
    }

    return savedEvent;
  }

  /**
   * Buffers a video heartbeat event for high-throughput batching.
   * Automatically flushes when buffer reaches batch threshold.
   *
   * @param {IDomainEventPayload} payload - Heartbeat payload.
   */
  public emitVideoHeartbeat(payload: IDomainEventPayload): void {
    this.videoHeartbeatBuffer.push({
      ...payload,
      eventType: DomainEventType.VIDEO_HEARTBEAT,
      occurredAt: payload.occurredAt || new Date(),
    });

    if (this.videoHeartbeatBuffer.length >= this.maxBatchSize) {
      this.flushVideoHeartbeats().catch((err) => {
        logger.error(`Error flushing video heartbeat batch: ${err.message}`);
      });
    }
  }

  /**
   * Flushes all accumulated video heartbeats to the database in a single batch.
   *
   * @returns {Promise<number>} Number of heartbeats persisted.
   */
  public async flushVideoHeartbeats(): Promise<number> {
    if (this.videoHeartbeatBuffer.length === 0) return 0;

    const itemsToFlush = [...this.videoHeartbeatBuffer];
    this.videoHeartbeatBuffer = [];

    try {
      const records = itemsToFlush.map((item) => ({
        instituteId: item.instituteId || undefined,
        actorId: item.actorId || undefined,
        eventType: DomainEventType.VIDEO_HEARTBEAT,
        entityType: item.entityType || "LessonVideo",
        entityId: item.entityId || undefined,
        properties: item.properties ? (item.properties as any) : undefined,
        occurredAt: item.occurredAt || new Date(),
      }));

      await prisma.analyticsEvent.createMany({
        data: records,
      });

      logger.info(`Flushed ${records.length} video heartbeat analytics events`);
      return records.length;
    } catch (error: any) {
      logger.error(`Failed to flush video heartbeat batch: ${error.message}`);
      return 0;
    }
  }

  /**
   * Routes domain events to relevant BullMQ queue jobs.
   */
  private async routeEventToQueues(payload: IDomainEventPayload): Promise<void> {
    switch (payload.eventType) {
      case DomainEventType.NOTICE_PUBLISHED: {
        // Enqueue notice fan-out job
        await notificationsQueue.add(
          "notice_fanout",
          {
            noticeId: payload.entityId!,
            instituteId: payload.instituteId!,
            title: payload.properties?.title || "New Announcement",
            content: payload.properties?.content || "",
            createdById: payload.actorId,
          },
          { jobId: `notice:${payload.entityId}` },
        );
        break;
      }

      case DomainEventType.TICKET_CREATED: {
        // Enqueue direct notification for support ticket creation
        if (payload.properties?.assignedToUserId) {
          await notificationsQueue.add("direct_notification", {
            userId: payload.properties.assignedToUserId,
            instituteId: payload.instituteId,
            type: "SUPPORT",
            title: `New Support Ticket Assigned: ${payload.properties?.ticketNumber || ""}`,
            message: payload.properties?.subject || "You have been assigned a new support ticket.",
            channel: "IN_APP",
            data: { ticketId: payload.entityId },
          });
        }
        break;
      }

      case DomainEventType.RESULT_PUBLISHED: {
        // Enqueue direct notification for published exam result
        if (payload.properties?.studentUserId) {
          await notificationsQueue.add("direct_notification", {
            userId: payload.properties.studentUserId,
            instituteId: payload.instituteId,
            type: "RESULT",
            title: "Exam Results Published",
            message: `Your results for ${payload.properties?.examTitle || "recent exam"} have been published.`,
            channel: "IN_APP",
            data: { examId: payload.entityId },
          });
        }
        break;
      }

      case DomainEventType.ATTENDANCE_MARKED: {
        // If marked ABSENT and notification to guardian enabled
        if (payload.properties?.status === "ABSENT" && payload.properties?.guardianUserId) {
          await notificationsQueue.add("direct_notification", {
            userId: payload.properties.guardianUserId,
            instituteId: payload.instituteId,
            type: "ATTENDANCE",
            title: "Student Absence Notice",
            message: `${payload.properties?.studentName || "Your child"} was marked ABSENT today.`,
            channel: "IN_APP",
            data: { attendanceId: payload.entityId },
          });
        }
        break;
      }

      default:
        break;
    }
  }

  public getHeartbeatBufferSize(): number {
    return this.videoHeartbeatBuffer.length;
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

export const domainEventEmitter = new DomainEventEmitter();
export default domainEventEmitter;
