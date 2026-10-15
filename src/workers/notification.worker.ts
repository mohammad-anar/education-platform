import { Worker, Job } from "bullmq";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import { emailHelper, emailTemplates } from "../utils/email.js";
import { getBullMQConnectionOptions } from "../queues/connection.js";
import {
  NOTIFICATIONS_QUEUE_NAME,
  INoticeFanoutJobPayload,
  IDirectNotificationJobPayload,
  IOverdueAlertJobPayload,
  ISubscriptionExpiryAlertJobPayload,
} from "../queues/notification.queue.js";
import { fanOutNoticeNotifications } from "../modules/platform/notice/notice.service.js";

/**
 * Processes a direct notification job: writes Notification row and dispatches email if applicable.
 */
async function processDirectNotification(payload: IDirectNotificationJobPayload) {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, firstName: true, settings: true },
  });

  if (!user) return;

  // Persist notification in database
  const notification = await prisma.notification.create({
    data: {
      userId: payload.userId,
      instituteId: payload.instituteId || undefined,
      type: (payload.type as any) || "GENERAL",
      title: payload.title,
      message: payload.message,
      channel: (payload.channel as any) || "IN_APP",
      data: payload.data || {},
    },
  });

  // Check user notification preferences for email channel
  const prefs = (user.settings?.notificationPrefs as any) || {};
  const typePrefs = prefs[payload.type] || prefs["GENERAL"] || {};
  const shouldEmail = typePrefs.email !== false && payload.channel !== "IN_APP" && !!user.email;

  if (shouldEmail && user.email) {
    await emailHelper
      .sendEmail({
        to: user.email,
        subject: payload.title,
        html: `<p>Hello ${user.firstName},</p><p>${payload.message}</p>`,
      })
      .catch((err) => {
        logger.error(`Failed to send email notification to ${user.email}: ${err.message}`);
      });
  }

  return notification;
}

/**
 * Processes overdue items check: scans for assignments, quizzes, and exams overdue for students.
 */
async function processOverdueAlerts(payload: IOverdueAlertJobPayload) {
  const now = new Date();

  // Find overdue assessments across active enrollments
  const overdueAssessments = await (prisma as any).assessment.findMany({
    where: {
      status: "PUBLISHED",
      OR: [{ dueAt: { lt: now } }, { closesAt: { lt: now } }],
      ...(payload.instituteId ? { instituteId: payload.instituteId } : {}),
    },
    take: 100,
    select: {
      id: true,
      title: true,
      instituteId: true,
      courseId: true,
      dueAt: true,
      closesAt: true,
      results: {
        select: { studentId: true, status: true },
      },
    },
  });

  let alertsSent = 0;
  for (const assessment of overdueAssessments) {
    if (!assessment.courseId) continue;
    // Find enrolled students in this course
    const enrollments = await (prisma as any).courseEnrollment.findMany({
      where: {
        courseId: assessment.courseId,
        status: "ACTIVE",
        ...(payload.studentId ? { studentId: payload.studentId } : {}),
      },
      take: 50,
      include: {
        student: {
          select: { userId: true },
        },
      },
    });

    const submittedStudentIds = new Set(
      assessment.results.filter((r: any) => r.status !== "DRAFT").map((r: any) => r.studentId),
    );

    const dueDate = assessment.dueAt || assessment.closesAt;
    for (const enrollment of enrollments) {
      if (!enrollment.student?.userId) continue;
      if (submittedStudentIds.has(enrollment.studentId)) continue;

      await (prisma as any).notification.create({
        data: {
          userId: enrollment.student.userId,
          instituteId: assessment.instituteId,
          type: "ASSIGNMENT",
          title: `Overdue Item: ${assessment.title}`,
          message: `Your item "${assessment.title}" was due on ${dueDate ? new Date(dueDate).toLocaleDateString() : "recently"}. Please complete it as soon as possible.`,
          channel: "IN_APP",
          data: { assessmentId: assessment.id },
        },
      });
      alertsSent++;
    }
  }

  logger.info(`Processed overdue item alerts. Sent: ${alertsSent}`);
  return { alertsSent };
}

/**
 * Processes upcoming subscription expiry alerts for institutes.
 */
async function processSubscriptionExpiryAlerts(payload: ISubscriptionExpiryAlertJobPayload) {
  const targetDays = payload.daysRemaining || 7;
  const now = new Date();
  const alertWindowEnd = new Date(now.getTime() + targetDays * 24 * 3600 * 1000);

  const expiringSubs = await (prisma as any).subscription.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL"] },
      expiresAt: {
        gte: now,
        lte: alertWindowEnd,
      },
      ...(payload.instituteId ? { instituteId: payload.instituteId } : {}),
    },
    include: {
      plan: true,
      institute: {
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            include: { user: true },
          },
        },
      },
    },
  });

  let noticesSent = 0;
  for (const sub of expiringSubs) {
    const daysLeft = sub.expiresAt
      ? Math.ceil((new Date(sub.expiresAt).getTime() - now.getTime()) / (1000 * 3600 * 24))
      : targetDays;

    for (const membership of sub.institute?.memberships || []) {
      if (!membership.userId) continue;
      await (prisma as any).notification.create({
        data: {
          userId: membership.userId,
          instituteId: sub.instituteId,
          type: "SUBSCRIPTION",
          title: "Subscription Renewal Notice",
          message: `Your ${sub.plan?.name || "Platform"} subscription expires in ${daysLeft} days (on ${sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : "soon"}). Please renew to avoid service disruption.`,
          channel: "IN_APP",
          data: { subscriptionId: sub.id, daysLeft },
        },
      });
      noticesSent++;
    }
  }

  logger.info(`Processed subscription expiry notices. Sent: ${noticesSent}`);
  return { noticesSent };
}

export const notificationWorker = new Worker(
  NOTIFICATIONS_QUEUE_NAME,
  async (job: Job) => {
    logger.info(`Processing notification job: ${job.name} (id: ${job.id})`);
    switch (job.name) {
      case "notice_fanout": {
        const p = job.data as INoticeFanoutJobPayload;
        return await fanOutNoticeNotifications({
          id: p.noticeId,
          instituteId: p.instituteId,
          title: p.title,
          content: p.content,
          createdById: p.createdById,
        });
      }
      case "direct_notification":
        return await processDirectNotification(job.data as IDirectNotificationJobPayload);
      case "overdue_item_alert":
        return await processOverdueAlerts(job.data as IOverdueAlertJobPayload);
      case "subscription_expiry_alert":
        return await processSubscriptionExpiryAlerts(
          job.data as ISubscriptionExpiryAlertJobPayload,
        );
      default:
        logger.warn(`Unknown notification job name: ${job.name}`);
        return null;
    }
  },
  {
    connection: getBullMQConnectionOptions(),
    concurrency: 5,
  },
);

notificationWorker.on("completed", (job) => {
  logger.info(`Notification job completed: ${job.id} (${job.name})`);
});

notificationWorker.on("failed", (job, err) => {
  logger.error(`Notification job failed: ${job?.id} (${job?.name}): ${err.message}`);
});

export default notificationWorker;
