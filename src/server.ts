import { Server } from "http";
import app from "./app.js";
import env from "./config/env.js";
import { initSocket } from "./config/socket.js";
import { connectRedis, redisClient } from "./config/redis.js";
import { seedSuperAdmin } from "./utils/seedSuperAdmin.js";
import prisma from "./config/prisma.js";
import logger from "./utils/logger.js";

let server: Server;

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception detected. Shutting down...", error);
  process.exit(1);
});

async function bootstrap() {
  try {
    // Connect to Redis
    await connectRedis();

    // Seed default super admin
    await seedSuperAdmin();

    // Start HTTP server
    server = app.listen(env.port, () => {
      logger.success(`🚀 Server running on http://localhost:${env.port}`);
      logger.info(`✨ Environment: ${env.node_env}`);
      logger.info(`🩺 Health Check: http://localhost:${env.port}/api/v1/health`);
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

bootstrap();
