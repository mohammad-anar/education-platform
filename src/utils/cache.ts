import redisClient from "../config/redis.js";
import logger from "./logger.js";

/**
 * Universal Redis Cache Helper
 */
export const cacheHelper = {
  /**
   * Retrieve cached value and auto-parse JSON
   */
  get: async <T>(key: string): Promise<T | null> => {
    try {
      if (!redisClient.isOpen) return null;
      const data = await redisClient.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error: any) {
      logger.error(`Cache get error for key "${key}":`, error.message);
      return null;
    }
  },

  /**
   * Set cache with TTL in seconds (default: 300s / 5 mins)
   */
  set: async <T>(key: string, value: T, ttlInSeconds = 300): Promise<boolean> => {
    try {
      if (!redisClient.isOpen) return false;
      const serialized = JSON.stringify(value);
      if (ttlInSeconds > 0) {
        await redisClient.setEx(key, ttlInSeconds, serialized);
      } else {
        await redisClient.set(key, serialized);
      }
      return true;
    } catch (error: any) {
      logger.error(`Cache set error for key "${key}":`, error.message);
      return false;
    }
  },

  /**
   * Delete one or multiple keys
   */
  del: async (key: string | string[]): Promise<boolean> => {
    try {
      if (!redisClient.isOpen) return false;
      const keys = Array.isArray(key) ? key : [key];
      if (keys.length === 0) return true;
      await redisClient.del(keys);
      return true;
    } catch (error: any) {
      logger.error(`Cache del error:`, error.message);
      return false;
    }
  },

  /**
   * Delete all keys matching a wildcard pattern (e.g. "users:*")
   */
  delByPattern: async (pattern: string): Promise<number> => {
    try {
      if (!redisClient.isOpen) return 0;
      const keys: string[] = [];
      for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        if (typeof key === "string") {
          keys.push(key);
        } else if (Array.isArray(key)) {
          keys.push(...key);
        }
      }
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return keys.length;
    } catch (error: any) {
      logger.error(`Cache delByPattern error for "${pattern}":`, error.message);
      return 0;
    }
  },

  /**
   * Get cached data or execute fetcher function and store result
   */
  getOrSet: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlInSeconds = 300,
  ): Promise<T> => {
    const cached = await cacheHelper.get<T>(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const freshData = await fetcher();
    if (freshData !== null && freshData !== undefined) {
      await cacheHelper.set(key, freshData, ttlInSeconds);
    }
    return freshData;
  },

  /**
   * Check if key exists
   */
  has: async (key: string): Promise<boolean> => {
    try {
      if (!redisClient.isOpen) return false;
      const count = await redisClient.exists(key);
      return count > 0;
    } catch (error: any) {
      logger.error(`Cache exists error for "${key}":`, error.message);
      return false;
    }
  },

  /**
   * Atomic increment counter
   */
  increment: async (key: string, ttlInSeconds?: number): Promise<number> => {
    try {
      if (!redisClient.isOpen) return 0;
      const value = await redisClient.incr(key);
      if (ttlInSeconds && value === 1) {
        await redisClient.expire(key, ttlInSeconds);
      }
      return value;
    } catch (error: any) {
      logger.error(`Cache incr error for "${key}":`, error.message);
      return 0;
    }
  },

  /**
   * Token Blacklisting (for Logout / Token Revocation)
   */
  blacklistToken: async (token: string, expirySeconds = 86400): Promise<void> => {
    try {
      if (!redisClient.isOpen) return;
      const key = `blacklist:${token}`;
      await redisClient.setEx(key, expirySeconds, "true");
    } catch (error: any) {
      logger.error("Error blacklisting token:", error.message);
    }
  },

  /**
   * Check if a token has been blacklisted
   */
  isTokenBlacklisted: async (token: string): Promise<boolean> => {
    try {
      if (!redisClient.isOpen) return false;
      const key = `blacklist:${token}`;
      const exists = await redisClient.exists(key);
      return exists > 0;
    } catch (error: any) {
      logger.error("Error checking token blacklist:", error.message);
      return false;
    }
  },

  /**
   * Store OTP in Redis with TTL (default 5 minutes)
   */
  setOtp: async (identifier: string, otp: string, ttlInSeconds = 300): Promise<void> => {
    try {
      if (!redisClient.isOpen) return;
      const key = `otp:${identifier}`;
      await redisClient.setEx(key, ttlInSeconds, otp);
    } catch (error: any) {
      logger.error("Error saving OTP in cache:", error.message);
    }
  },

  /**
   * Verify and consume OTP (one-time use)
   */
  verifyOtp: async (identifier: string, otp: string): Promise<boolean> => {
    try {
      if (!redisClient.isOpen) return false;
      const key = `otp:${identifier}`;
      const storedOtp = await redisClient.get(key);
      if (storedOtp && storedOtp === otp) {
        await redisClient.del(key);
        return true;
      }
      return false;
    } catch (error: any) {
      logger.error("Error verifying OTP in cache:", error.message);
      return false;
    }
  },
};

export default cacheHelper;
