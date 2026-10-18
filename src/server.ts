import { Server } from "http";
import app from "./app.js";
import env from "./config/env.js";
import { initSocket } from "./config/socket.js";
import { connectRedis, redisClient } from "./config/redis.js";
import { seedSuperAdmin } from "./utils/seedSuperAdmin.js";
import prisma from "./config/prisma.js";
import logger from "./utils/logger.js";
import { scheduleRepeatableJobs } from "./jobs/schedulers.js";
import { stopAllWorkers } from "./workers/index.js";
import { domainEventEmitter } from "./events/index.js";

let server: Server;

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception detected. Shutting down...", error);
  process.exit(1);
});

async function bootstrap() {
  try {
    // Connect to Redis
    await connectRedis();

    // Schedule repeatable BullMQ jobs (attendance rollup, expiry notice, overdue alerts)
    await scheduleRepeatableJobs().catch((err) => {
      logger.warn(`Could not initialize repeatable BullMQ jobs: ${err.message}`);
    });

    // Seed default super admin
    await seedSuperAdmin();

    // Start HTTP server
    server = app.listen(env.port, () => {
      logger.success(`🚀 Server running on http://localhost:${env.port}`);
      logger.info(`✨ Environment: ${env.node_env}`);
      logger.info(`🩺 Health Check: http://localhost:${env.port}/api/v1/health`);
      logger.info(`📖 Swagger Docs: http://localhost:${env.port}/api/docs`);
      logger.info(`📄 OpenAPI Spec: http://localhost:${env.port}/api/docs/openapi.json`);
    });

    // Initialize Socket.io
    initSocket(server);
  } catch (error: any) {
    logger.error("Error during server startup:", error);
    process.exit(1);
  }
}

const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} signal received. Closing HTTP server gracefully...`);

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed.");

      // Flush any buffered video heartbeats
      try {
        await domainEventEmitter.flushVideoHeartbeats();
        logger.info("Video heartbeats flushed.");
      } catch (e: any) {
        logger.error("Error flushing video heartbeats:", e.message);
      }

      // Stop BullMQ workers
      try {
        await stopAllWorkers();
        logger.info("BullMQ workers stopped.");
      } catch (e: any) {
        logger.error("Error stopping BullMQ workers:", e.message);
      }

      // Disconnect Redis
      try {
        if (redisClient.isOpen) {
          await redisClient.quit();
          logger.info("Redis disconnected.");
        }
      } catch (e: any) {
        logger.error("Error closing Redis connection:", e.message);
      }

      // Disconnect Prisma
      try {
        await prisma.$disconnect();
        logger.info("Prisma disconnected.");
      } catch (e: any) {
        logger.error("Error closing Prisma connection:", e.message);
      }

      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("unhandledRejection", (error: any) => {
  logger.error("Unhandled Rejection detected:", error);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Bootstrap application server
bootstrap();
