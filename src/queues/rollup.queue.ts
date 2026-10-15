import { Queue } from "bullmq";
import { getBullMQConnectionOptions } from "./connection.js";

export const ROLLUPS_QUEUE_NAME = "rollups";

export interface INightlyAttendanceRollupJobPayload {
  date?: string; // YYYY-MM-DD
  instituteId?: string;
}

export interface IKpiRollupJobPayload {
  instituteId?: string;
}

export const rollupsQueue = new Queue(ROLLUPS_QUEUE_NAME, {
  connection: getBullMQConnectionOptions(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 1000 },
  },
});

export default rollupsQueue;
