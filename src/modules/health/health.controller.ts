import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { prismaHelper } from "../../utils/prismaHelper.js";
import { checkRedisHealth } from "../../config/redis.js";
import env from "../../config/env.js";

const getHealthStatus = catchAsync(async (req: Request, res: Response) => {
  const [dbHealth, redisHealth] = await Promise.all([
    prismaHelper.checkDbHealth(),
    checkRedisHealth(),
  ]);

  const isHealthy = dbHealth.status === "healthy" && redisHealth.status === "healthy";

  const memoryUsage = process.memoryUsage();
  const formatMb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + " MB";

  sendResponse(res, {
    statusCode: isHealthy ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE,
    success: isHealthy,
    message: isHealthy ? "System is fully operational" : "System services degraded",
    data: {
      status: isHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.node_env,
      services: {
        database: {
          name: "PostgreSQL (Prisma)",
          status: dbHealth.status,
          latencyMs: dbHealth.latencyMs,
        },
        redis: {
          name: "Redis Cache",
          status: redisHealth.status,
          latencyMs: redisHealth.latencyMs,
        },
      },
      system: {
        nodeVersion: process.version,
        memory: {
          rss: formatMb(memoryUsage.rss),
          heapTotal: formatMb(memoryUsage.heapTotal),
          heapUsed: formatMb(memoryUsage.heapUsed),
        },
      },
    },
  });
});

export const HealthController = {
  getHealthStatus,
};

export default HealthController;
