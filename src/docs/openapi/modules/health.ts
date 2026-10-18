import { z } from "zod";
import { registerRoute, successResponse } from "../helpers.js";

const HealthDataSchema = z.object({
  status: z.enum(["healthy", "degraded"]).openapi({ example: "healthy" }),
  timestamp: z.string().openapi({ example: "2026-10-18T08:00:00.000Z" }),
  uptimeSeconds: z.number().int().openapi({ example: 3600 }),
  environment: z.string().openapi({ example: "development" }),
  services: z.object({
    database: z.object({
      name: z.string().openapi({ example: "PostgreSQL (Prisma)" }),
      status: z.string().openapi({ example: "healthy" }),
      latencyMs: z.number().openapi({ example: 4 }),
    }),
    redis: z.object({
      name: z.string().openapi({ example: "Redis Cache" }),
      status: z.string().openapi({ example: "healthy" }),
      latencyMs: z.number().openapi({ example: 1 }),
    }),
  }),
  system: z.object({
    nodeVersion: z.string().openapi({ example: "v20.18.0" }),
    memory: z.object({
      rss: z.string().openapi({ example: "85.20 MB" }),
      heapTotal: z.string().openapi({ example: "45.10 MB" }),
      heapUsed: z.string().openapi({ example: "32.40 MB" }),
    }),
  }),
});

registerRoute({
  method: "get",
  path: "/api/v1/health",
  tag: "Health",
  summary: "System Health Diagnostics",
  description: "Public health check endpoint inspecting database connectivity, Redis connection, and node memory metrics.",
  isPublic: true,
  operationId: "getHealthStatus",
  responses: {
    200: {
      description: "System services healthy and operational",
      content: {
        "application/json": {
          schema: successResponse(HealthDataSchema, "System is fully operational"),
        },
      },
    },
  },
});
