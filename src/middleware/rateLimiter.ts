import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import cacheHelper from "../utils/cache.js";
import ApiError from "../utils/ApiError.js";

interface RateLimiterOptions {
  windowSeconds: number;
  maxRequests: number;
  keyPrefix?: string;
  message?: string;
}

// In-memory fallback if Redis is unavailable
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export const createRateLimiter = (options: RateLimiterOptions) => {
  const {
    windowSeconds = 60,
    maxRequests = 100,
    keyPrefix = "rl",
    message = "Too many requests, please try again later.",
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown_ip";
    const key = `${keyPrefix}:${ip}`;

    try {
      // Try Redis first
      const current = await cacheHelper.increment(key, windowSeconds);

      if (current > maxRequests) {
        res.setHeader("Retry-After", windowSeconds);
        return next(new ApiError(StatusCodes.TOO_MANY_REQUESTS, message));
      }

      res.setHeader("X-RateLimit-Limit", maxRequests);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, maxRequests - current));
      return next();
    } catch {
      // In-memory fallback
      const now = Date.now();
      const clientRecord = memoryStore.get(key);

      if (!clientRecord || clientRecord.resetAt < now) {
        memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
        return next();
      }

      clientRecord.count += 1;
      if (clientRecord.count > maxRequests) {
        return next(new ApiError(StatusCodes.TOO_MANY_REQUESTS, message));
      }

      return next();
    }
  };
};

/**
 * Standard API rate limiter: 120 requests per minute
 */
export const generalLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 120,
  keyPrefix: "rl:api",
});

/**
 * Strict rate limiter for Auth endpoints (login, forgot-password, register): 10 requests per 5 minutes
 */
export const authLimiter = createRateLimiter({
  windowSeconds: 300,
  maxRequests: 15,
  keyPrefix: "rl:auth",
  message: "Too many authentication attempts. Please try again after a few minutes.",
});

export default {
  createRateLimiter,
  generalLimiter,
  authLimiter,
};
