import { Queue } from "bullmq";
import { getBullMQConnectionOptions } from "./connection.js";

export const NOTIFICATIONS_QUEUE_NAME = "notifications";

export interface INoticeFanoutJobPayload {
  noticeId: string;
  instituteId: string;
  title: string;
  content: string;
  createdById?: string | null;
}

export interface IDirectNotificationJobPayload {
  userId: string;
  instituteId?: string | null;
  type: string;
  title: string;
  message: string;
  channel?: string;
  data?: any;
}

export interface IOverdueAlertJobPayload {
  instituteId?: string;
  studentId?: string;
}

export interface ISubscriptionExpiryAlertJobPayload {
  instituteId?: string;
  daysRemaining?: number;
}

export const notificationsQueue = new Queue(NOTIFICATIONS_QUEUE_NAME, {
  connection: getBullMQConnectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

export default notificationsQueue;
