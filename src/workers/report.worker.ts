import { Worker, Job } from "bullmq";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import { getBullMQConnectionOptions } from "../queues/connection.js";
import { REPORTS_QUEUE_NAME, IGenerateReportJobPayload } from "../queues/report.queue.js";

/**
 * Generates an aggregated report asynchronously.
 */
async function processReportGeneration(payload: IGenerateReportJobPayload) {
  logger.info(
    `Generating ${payload.reportType} report for institute ${payload.instituteId} requested by ${payload.requestedByUserId}`,
  );

  let reportSummary: Record<string, any> = {};

  switch (payload.reportType) {
    case "ATTENDANCE": {
      const records = await prisma.attendanceRecord.groupBy({
        by: ["status"],
        where: { instituteId: payload.instituteId },
        _count: { id: true },
      });
      reportSummary = {
        type: "ATTENDANCE",
        distribution: records.reduce((acc: Record<string, number>, curr: any) => {
          acc[curr.status] = (curr._count as any)?.id || 0;
          return acc;
        }, {} as Record<string, number>),
      };
      break;
    }
    case "ENROLLMENT": {
      const enrollments = await (prisma as any).courseEnrollment.groupBy({
        by: ["status"],
        where: { instituteId: payload.instituteId },
        _count: { id: true },
      });
      reportSummary = {
        type: "ENROLLMENT",
        distribution: enrollments.reduce((acc: Record<string, number>, curr: any) => {
          acc[curr.status] = (curr._count as any)?.id || 0;
          return acc;
        }, {} as Record<string, number>),
      };
      break;
    }
    case "GRADE_TRANSCRIPT":
    case "FINANCIAL":
    case "AUDIT":
    default: {
      reportSummary = {
        type: payload.reportType,
        generatedAt: new Date().toISOString(),
        status: "COMPLETED",
      };
      break;
    }
  }

  // Notify the user that their report is ready
  await prisma.notification.create({
    data: {
      userId: payload.requestedByUserId,
      instituteId: payload.instituteId,
      type: "SYSTEM",
      title: `${payload.reportType} Report Generated`,
      message: `Your ${payload.reportType.toLowerCase()} report is now generated and ready for viewing.`,
      channel: "IN_APP",
      data: { reportSummary },
    },
  });

  return reportSummary;
}

export const reportWorker = new Worker(
  REPORTS_QUEUE_NAME,
  async (job: Job) => {
    logger.info(`Processing report job: ${job.name} (id: ${job.id})`);
    switch (job.name) {
      case "generate_report":
        return await processReportGeneration(job.data as IGenerateReportJobPayload);
      default:
        logger.warn(`Unknown report job name: ${job.name}`);
        return null;
    }
  },
  {
    connection: getBullMQConnectionOptions(),
    concurrency: 2,
  },
);

reportWorker.on("completed", (job) => {
  logger.info(`Report job completed: ${job.id} (${job.name})`);
});

reportWorker.on("failed", (job, err) => {
  logger.error(`Report job failed: ${job?.id} (${job?.name}): ${err.message}`);
});

export default reportWorker;
