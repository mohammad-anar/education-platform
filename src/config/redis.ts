import { createClient } from "redis";
import env from "./env.js";
import logger from "../utils/logger.js";

export const redisClient = createClient({
  url: env.redis_url,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 10) {
        logger.error("Redis reconnection failed after 10 attempts");
        return new Error("Redis reconnection failed");
      }
      return Math.min(retries * 200, 3000);
    },
  },
});

redisClient.on("error", (err) => {
  logger.error(`Redis Client Error: ${err.message}`);
});

redisClient.on("connect", () => {
  logger.info("Redis socket connecting...");
});

redisClient.on("ready", () => {
  logger.success("⚡ Redis connected and ready");
});

redisClient.on("reconnecting", () => {
  logger.warn("Redis reconnecting...");
});

export const connectRedis = async (): Promise<boolean> => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      return true;
    }
    return true;
  } catch (err: any) {
    logger.error(`⚠️ Redis connection failed: ${err.message}`);
    return false;
  }
};

export const checkRedisHealth = async (): Promise<{ status: string; latencyMs: number }> => {
  const start = Date.now();
  try {
    if (!redisClient.isOpen) {
      await connectRedis();
    }
    await redisClient.ping();
    return {
      status: "healthy",
      latencyMs: Date.now() - start,
    };
  } catch (error: any) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
    };
  }
};

export default redisClient;
