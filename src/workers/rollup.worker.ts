import { Worker, Job } from "bullmq";
import prisma from "../config/prisma.js";
import logger from "../utils/logger.js";
import cacheHelper from "../utils/cache.js";
import { getBullMQConnectionOptions } from "../queues/connection.js";
import {
  ROLLUPS_QUEUE_NAME,
  INightlyAttendanceRollupJobPayload,
  IKpiRollupJobPayload,
} from "../queues/rollup.queue.js";

/**
 * Executes the nightly attendance rollup across institutes.
 */
async function processNightlyAttendanceRollup(payload: INightlyAttendanceRollupJobPayload) {
  const targetDateStr = payload.date || new Date().toISOString().split("T")[0];
  const startOfDay = new Date(`${targetDateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${targetDateStr}T23:59:59.999Z`);

  logger.info(`Running nightly attendance rollup for date: ${targetDateStr}`);

  // Fetch target institutes
  const institutes = await prisma.institute.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      ...(payload.instituteId ? { id: payload.instituteId } : {}),
    },
    select: { id: true, name: true },
  });

  const results: any[] = [];

  for (const inst of institutes) {
    const records = await (prisma as any).attendanceRecord.groupBy({
      by: ["status"],
      where: {
        instituteId: inst.id,
        markedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _count: { id: true },
    });

    const breakdown = records.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.status] = (curr._count as any)?.id || 0;
      return acc;
    }, {} as Record<string, number>);

    const total = (Object.values(breakdown) as number[]).reduce((a: number, b: number) => a + b, 0);
    const present = breakdown["PRESENT"] || 0;
    const rate = total > 0 ? Number(((present / total) * 100).toFixed(2)) : 100;

    const rollupData = {
      instituteId: inst.id,
      date: targetDateStr,
      total,
      breakdown,
      rate,
      calculatedAt: new Date().toISOString(),
    };

    // Cache in Redis for fast dashboard loading
    const cacheKey = `rollup:attendance:${inst.id}:${targetDateStr}`;
    await cacheHelper.set(cacheKey, rollupData, 86400 * 30); // 30 days retention

    results.push(rollupData);
  }

  logger.info(`Nightly attendance rollup completed for ${institutes.length} institutes`);
  return { date: targetDateStr, totalInstitutes: institutes.length, results };
}

/**
 * Warms or refreshes KPI caches for tenants.
 */
async function processKpiRollup(payload: IKpiRollupJobPayload) {
  logger.info("Running platform/institute KPI rollup");

  const [totalStudents, totalTeachers, totalCourses, activeTenants] = await Promise.all([
    prisma.student.count({ where: { status: "ACTIVE" } }),
    prisma.teacherProfile.count(),
    prisma.course.count({ where: { deletedAt: null } }),
    prisma.institute.count({ where: { status: "ACTIVE", deletedAt: null } }),
  ]);

  const kpis = {
    totalStudents,
    totalTeachers,
    totalCourses,
    activeTenants,
    updatedAt: new Date().toISOString(),
  };

  await cacheHelper.set("rollup:kpi:platform", kpis, 3600);
  return kpis;
}

export const rollupWorker = new Worker(
  ROLLUPS_QUEUE_NAME,
  async (job: Job) => {
    logger.info(`Processing rollup job: ${job.name} (id: ${job.id})`);
    switch (job.name) {
      case "nightly_attendance_rollup":
        return await processNightlyAttendanceRollup(
          job.data as INightlyAttendanceRollupJobPayload,
        );
      case "kpi_summary_rollup":
        return await processKpiRollup(job.data as IKpiRollupJobPayload);
      default:
        logger.warn(`Unknown rollup job name: ${job.name}`);
        return null;
    }
  },
  {
    connection: getBullMQConnectionOptions(),
    concurrency: 2,
  },
);

rollupWorker.on("completed", (job) => {
  logger.info(`Rollup job completed: ${job.id} (${job.name})`);
});

rollupWorker.on("failed", (job, err) => {
  logger.error(`Rollup job failed: ${job?.id} (${job?.name}): ${err.message}`);
});

export default rollupWorker;
