import { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma.js";
import logger from "./logger.js";

/**
 * List of sensitive key names that must be redacted from audit logs.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "passwordhash",
  "token",
  "refreshtoken",
  "accesstoken",
  "secret",
  "jwt_secret",
  "jwt_refresh_secret",
  "otp",
  "newpassword",
  "oldpassword",
]);

/**
 * Represents the contextual metadata of an operation to be audited.
 */
export interface IAuditContext {
  instituteId?: string | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
}

/**
 * Input parameters required to record an audit log entry.
 */
export interface ILogAuditParams {
  ctx?: IAuditContext | Request;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: any;
  newValue?: any;
}

/**
 * Recursively deep-clones an object and redacts any sensitive keys.
 * Also serializes Dates, BigInts, and Prisma Decimal objects to standard JSON types.
 *
 * @param {any} data - The raw data to sanitize.
 * @returns {any} A sanitized copy with sensitive fields replaced by "[REDACTED]".
 */
export const maskSensitiveData = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data === "bigint") return data.toString();
  if (typeof data !== "object") return data;

  if (data instanceof Date) return data.toISOString();

  // Handle Prisma Decimal or similar objects
  if (typeof (data as any)?.toNumber === "function") {
    return (data as any).toNumber();
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (SENSITIVE_KEYS.has(normalizedKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "bigint") {
      sanitized[key] = value.toString();
    } else if (typeof (value as any)?.toNumber === "function") {
      sanitized[key] = (value as any).toNumber();
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = maskSensitiveData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Calculates the difference between two states of an object, returning only changed keys.
 * Sensitive values (passwords, tokens) are automatically masked.
 *
 * @param {any} oldObj - The original state before mutation.
 * @param {any} newObj - The modified state after mutation.
 * @returns {Record<string, { old: any; new: any }> | null} An object mapping changed keys to their old and new values, or null if identical.
 */
export const diffObjects = (
  oldObj: any,
  newObj: any,
): Record<string, { old: any; new: any }> | null => {
  if (!oldObj && !newObj) return null;

  const sanitizedOld = maskSensitiveData(oldObj) || {};
  const sanitizedNew = maskSensitiveData(newObj) || {};

  const allKeys = new Set([
    ...Object.keys(sanitizedOld),
    ...Object.keys(sanitizedNew),
  ]);

  const diff: Record<string, { old: any; new: any }> = {};
  let hasChange = false;

  for (const key of allKeys) {
    const oldVal = sanitizedOld[key];
    const newVal = sanitizedNew[key];

    const oldStr = typeof oldVal === "object" ? JSON.stringify(oldVal) : oldVal;
    const newStr = typeof newVal === "object" ? JSON.stringify(newVal) : newVal;

    if (oldStr !== newStr) {
      diff[key] = { old: oldVal, new: newVal };
      hasChange = true;
    }
  }

  return hasChange ? diff : null;
};

/**
 * Extracts audit metadata from either an explicit context object or an Express Request.
 *
 * @param {IAuditContext | Request} [ctx] - The audit context or Express request object.
 * @returns {IAuditContext} Normalized audit metadata.
 */
export const extractAuditContext = (
  ctx?: IAuditContext | Request,
): IAuditContext => {
  if (!ctx) return {};

  // Check if ctx is an Express Request
  if ("headers" in ctx || "socket" in ctx || "method" in ctx) {
    const req = ctx as Request;

    if (req.ctx) {
      return {
        instituteId: req.ctx.instituteId || null,
        userId: req.ctx.userId || null,
        ipAddress: req.ctx.ipAddress || null,
        userAgent: req.ctx.userAgent || null,
        requestId: req.ctx.requestId || null,
      };
    }

    const user = req.user as any;

    const rawIp =
      req.ip ||
      (req.headers["x-forwarded-for"] as string) ||
      req.socket?.remoteAddress ||
      null;

    const cleanIp =
      typeof rawIp === "string" ? rawIp.split(",")[0].trim() : null;

    return {
      instituteId:
        user?.instituteId ||
        (req.headers["x-institute-id"] as string) ||
        req.params?.instituteId ||
        null,
      userId: user?.id || user?.userId || null,
      ipAddress: cleanIp,
      userAgent: (req.headers["user-agent"] as string) || null,
      requestId:
        (req.headers["x-request-id"] as string) ||
        (req.headers["x-correlation-id"] as string) ||
        null,
    };
  }

  return {
    instituteId: ctx.instituteId || null,
    userId: ctx.userId || null,
    ipAddress: ctx.ipAddress || null,
    userAgent: ctx.userAgent || null,
    requestId: ctx.requestId || null,
  };
};

/**
 * Records an entry in the system AuditLog.
 * Guarantees zero unhandled exceptions: all potential errors are caught and logged to prevent breaking main business transactions.
 *
 * @param {ILogAuditParams} params - The audit entry parameters.
 * @returns {Promise<any>} The created AuditLog record or null if logging failed.
 */
export const logAudit = async (params: ILogAuditParams): Promise<any> => {
  try {
    const { ctx, action, entityType, entityId, oldValue, newValue } = params;
    const context = extractAuditContext(ctx);

    const sanitizedOld = oldValue
      ? JSON.parse(
          JSON.stringify(maskSensitiveData(oldValue), (_, v) =>
            typeof v === "bigint" ? v.toString() : v,
          ),
        )
      : null;
    const sanitizedNew = newValue
      ? JSON.parse(
          JSON.stringify(maskSensitiveData(newValue), (_, v) =>
            typeof v === "bigint" ? v.toString() : v,
          ),
        )
      : null;

    const auditRecord = await prisma.auditLog.create({
      data: {
        instituteId: context.instituteId || null,
        userId: context.userId || null,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        oldValue: sanitizedOld,
        newValue: sanitizedNew,
        ipAddress: context.ipAddress || null,
        userAgent: context.userAgent || null,
        requestId: context.requestId || null,
      },
    });

    return auditRecord;
  } catch (error: any) {
    logger.error(`[AUDIT_LOG_ERROR] Failed to write audit log for action "${params.action}":`, error.message);
    return null;
  }
};

/**
 * Express middleware to automatically log audit events for simple mutation routes upon successful completion.
 *
 * @param {string} action - The audit action identifier (e.g. "ROLE_DELETE").
 * @param {string} entityType - The targeted entity name (e.g. "Role").
 * @returns {Function} An Express middleware function.
 */
export const auditMiddleware = (action: string, entityType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const entityId = req.params?.id || (res.locals?.auditEntityId as string) || null;
        logAudit({
          ctx: req,
          action,
          entityType,
          entityId,
          newValue: req.body,
        }).catch(() => {});
      }
    });

    next();
  };
};

export default {
  logAudit,
  diffObjects,
  maskSensitiveData,
  extractAuditContext,
  auditMiddleware,
};
