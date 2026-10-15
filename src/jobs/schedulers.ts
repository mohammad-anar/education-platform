import { rollupsQueue } from "../queues/rollup.queue.js";
import { notificationsQueue } from "../queues/notification.queue.js";
import logger from "../utils/logger.js";

/**
 * Registers cron-based repeatable jobs with BullMQ:
 * 1. Nightly attendance rollup (Midnight 00:00)
 * 2. Subscription expiry notice (Daily 08:00 AM)
 * 3. Overdue-item notification to students (Daily 09:00 AM)
 */
export async function scheduleRepeatableJobs(): Promise<void> {
  try {
    // 1. Nightly Attendance Rollup
    if (typeof (rollupsQueue as any).upsertJobScheduler === "function") {
      await (rollupsQueue as any).upsertJobScheduler(
        "nightly_attendance_rollup",
        { pattern: "0 0 * * *" },
        { name: "nightly_attendance_rollup", data: {} },
      );
    } else {
      await rollupsQueue.add(
        "nightly_attendance_rollup",
        {},
        {
          repeat: { pattern: "0 0 * * *" },
          jobId: "repeatable:nightly_attendance_rollup",
          removeOnComplete: true,
        } as any,
      );
    }

    // 2. Subscription Expiry Notice (alerts for 7-day upcoming expiry)
    if (typeof (notificationsQueue as any).upsertJobScheduler === "function") {
      await (notificationsQueue as any).upsertJobScheduler(
        "subscription_expiry_alert",
        { pattern: "0 8 * * *" },
        { name: "subscription_expiry_alert", data: { daysRemaining: 7 } },
      );
    } else {
      await notificationsQueue.add(
        "subscription_expiry_alert",
        { daysRemaining: 7 },
        {
          repeat: { pattern: "0 8 * * *" },
          jobId: "repeatable:subscription_expiry_alert",
          removeOnComplete: true,
        } as any,
      );
    }

    // 3. Overdue-Item Notification to Students
    if (typeof (notificationsQueue as any).upsertJobScheduler === "function") {
      await (notificationsQueue as any).upsertJobScheduler(
        "overdue_item_alert",
        { pattern: "0 9 * * *" },
        { name: "overdue_item_alert", data: {} },
      );
    } else {
      await notificationsQueue.add(
        "overdue_item_alert",
        {},
        {
          repeat: { pattern: "0 9 * * *" },
          jobId: "repeatable:overdue_item_alert",
          removeOnComplete: true,
        } as any,
      );
    }

    logger.success("⚡ Repeatable BullMQ jobs registered successfully");
  } catch (error: any) {
    logger.error(`Failed to register repeatable jobs: ${error.message}`);
  }
}

export default scheduleRepeatableJobs;
