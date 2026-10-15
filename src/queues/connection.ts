import { RedisOptions } from "ioredis";
import env from "../config/env.js";

/**
 * Returns Redis connection options required by BullMQ (requires maxRetriesPerRequest: null).
 *
 * @returns {RedisOptions} Connection options for BullMQ queues and workers.
 */
export function getBullMQConnectionOptions(): any {
  try {
    const rawUrl = env.redis_url || "redis://localhost:6379";
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname || "localhost",
      port: Number(parsed.port) || 6379,
      password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
      username: parsed.username ? decodeURIComponent(parsed.username) : undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };
  } catch {
    return {
      host: "localhost",
      port: 6379,
      maxRetriesPerRequest: null,
    };
  }
}

export default getBullMQConnectionOptions;
