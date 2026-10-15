import { Queue } from "bullmq";
import { getBullMQConnectionOptions } from "./connection.js";

export const REPORTS_QUEUE_NAME = "reports";

export interface IGenerateReportJobPayload {
  reportType: "ATTENDANCE" | "ENROLLMENT" | "GRADE_TRANSCRIPT" | "FINANCIAL" | "AUDIT";
  instituteId: string;
  requestedByUserId: string;
  filters?: Record<string, any>;
}

export const reportsQueue = new Queue(REPORTS_QUEUE_NAME, {
  connection: getBullMQConnectionOptions(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});

export default reportsQueue;
