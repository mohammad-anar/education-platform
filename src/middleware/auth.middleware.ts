import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import env from "../config/env.js";
import prisma from "../config/prisma.js";
import ApiError from "../utils/ApiError.js";
import { jwtHelper } from "../utils/jwt.js";
import cacheHelper from "../utils/cache.js";
import { can, ICanResult } from "../modules/identity/permission-engine/permission-evaluator.js";
import { PermissionScope } from "../modules/identity/permission-engine/permission-catalog.js";

export interface RequirePermissionOptions {
  getResource?: (req: Request) => any | Promise<any>;
}

/**
 * Extracts and normalizes client IP address from request headers or socket.
 */
const getClientIp = (req: Request): string | null => {
  const rawIp =
    req.ip ||
    (req.headers["x-forwarded-for"] as string) ||
    req.socket?.remoteAddress ||
    null;
  return typeof rawIp === "string" ? rawIp.split(",")[0].trim() : null;
};

/**
 * Authenticates user by validating JWT Bearer token and checking the Redis blacklist.
 * Attaches the decoded token payload to `req.user`.
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next handler
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tokenWithBearer = req.headers.authorization;
    if (!tokenWithBearer) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "You are not authorized");
    }

    if (!tokenWithBearer.startsWith("Bearer ")) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Invalid token format! Token must start with Bearer",
      );
    }

    const token = tokenWithBearer.split(" ")[1];

    // Check if token has been revoked / blacklisted in Redis
    const isBlacklisted = await cacheHelper.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Token has been revoked. Please log in again.");
    }

    // Verify token
    const verifyUser = jwtHelper.verifyToken(
      token,
      env.jwt.jwt_secret as Secret,
    );

    // Attach user payload to request
    req.user = verifyUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Resolves the active tenant context for the request.
 * Reads instituteId from the `X-Institute-Id` header or the JWT token.
 * Verifies an ACTIVE InstituteMembership (exempt for platform super admins).
 * Checks that the Institute is not suspended and that its Subscription is active/valid.
 * Attaches the populated context object to `req.ctx`.
 *
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next handler
 */
export const resolveTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // Ensure authentication has occurred
    if (!req.user) {
      await new Promise<void>((resolve, reject) => {
        authenticate(req, res, (err) => (err ? reject(err) : resolve()));
      });
    }

    const userId = req.user?.id || req.user?.userId;
    if (!userId) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User identity not found in token");
    }

    // Check if user is Platform Super Admin (instituteId=null, isSystem=true; relational check)
    const platformAdminRole = await (prisma as any).userRole.findFirst({
      where: {
        userId,
        role: {
          instituteId: null,
          isSystem: true,
        },
      },
    });
    const isPlatformAdmin = !!platformAdminRole;

    // Extract instituteId from header or token
    const rawHeader = req.headers["x-institute-id"];
    const instituteId =
      (typeof rawHeader === "string"
        ? rawHeader
        : Array.isArray(rawHeader)
        ? rawHeader[0]
        : req.user?.instituteId) || null;

    const ipAddress = getClientIp(req);
    const userAgent = (req.headers["user-agent"] as string) || null;
    const requestId =
      (req.headers["x-request-id"] as string) ||
      (req.headers["x-correlation-id"] as string) ||
      null;

    // Platform Super Admin Bypass: exempt from tenant membership & subscription constraints
    if (isPlatformAdmin) {
      if (instituteId) {
        // If an explicit instituteId was targeted, verify it exists and is not deleted
        const inst = await (prisma as any).institute.findUnique({
          where: { id: instituteId },
          select: { id: true, deletedAt: true },
        });
        if (!inst || inst.deletedAt) {
          throw new ApiError(StatusCodes.NOT_FOUND, "Institute not found");
        }
      }

      req.ctx = {
        userId,
        instituteId,
        isPlatformAdmin: true,
        ipAddress,
        userAgent,
        requestId,
      };
      return next();
    }

    // Tenant Context Required for regular users
    if (!instituteId) {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Tenant context required. Provide X-Institute-Id header or login to an institute.",
        code: "TENANT_REQUIRED",
        error: { code: "TENANT_REQUIRED" },
      });
      return;
    }

    // Verify Institute Exists and is not deleted
    const institute = await (prisma as any).institute.findUnique({
      where: { id: instituteId },
      select: { id: true, status: true, deletedAt: true },
    });

    if (!institute || institute.deletedAt) {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Institute not found",
        code: "NOT_FOUND",
      });
      return;
    }

    if (institute.status === "SUSPENDED" || institute.status === "INACTIVE") {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Institute account is suspended or inactive",
        code: "INSTITUTE_SUSPENDED",
        error: { code: "INSTITUTE_SUSPENDED" },
      });
      return;
    }

    // Verify ACTIVE InstituteMembership
    const membership = await (prisma as any).instituteMembership.findUnique({
      where: {
        instituteId_userId: {
          instituteId,
          userId,
        },
      },
      select: { status: true },
    });

    if (!membership || membership.status !== "ACTIVE") {
      res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: "Active institute membership required",
        code: "MEMBERSHIP_INACTIVE",
        error: { code: "MEMBERSHIP_INACTIVE" },
      });
      return;
    }

    // Verify Subscription Status
    const subscription = await (prisma as any).subscription.findUnique({
      where: { instituteId },
      select: { status: true, expiresAt: true },
    });

    if (subscription) {
      if (subscription.status === "SUSPENDED") {
        res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Institute subscription is suspended",
          code: "SUBSCRIPTION_SUSPENDED",
          error: { code: "SUBSCRIPTION_SUSPENDED" },
        });
        return;
      }

      const isExpired =
        subscription.status === "EXPIRED" ||
        (subscription.expiresAt && new Date(subscription.expiresAt) < new Date());

      if (isExpired) {
        // Read-only access permitted for EXPIRED subscriptions; block mutations
        const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method.toUpperCase());
        if (isMutation) {
          res.status(StatusCodes.FORBIDDEN).json({
            success: false,
            message: "Institute subscription has expired. Read-only access permitted.",
            code: "SUBSCRIPTION_EXPIRED",
            error: { code: "SUBSCRIPTION_EXPIRED" },
          });
          return;
        }
      }
    }

    // Context successfully resolved and verified
    req.ctx = {
      userId,
      instituteId,
      isPlatformAdmin: false,
      ipAddress,
      userAgent,
      requestId,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Route protection middleware requiring a specific permission code.
 * Calls `can(req.ctx, code, resource)` and enforces permission checks.
 * For OWN / ASSIGNED scopes, attaches `req.ctx.scope` for downstream services.
 *
 * @param {string} code - The required permission code (e.g. "lms.course.update").
 * @param {RequirePermissionOptions} [opts] - Optional resource loader for contextual checks.
 */
export const requirePermission = (
  code: string,
  opts?: RequirePermissionOptions,
) => {
  const handler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // 1. Ensure authentication
      if (!req.user) {
        await new Promise<void>((resolve, reject) => {
          authenticate(req, res, (err) => (err ? reject(err) : resolve()));
        });
      }

      // 2. Ensure tenant resolution
      if (!req.ctx) {
        await new Promise<void>((resolve, reject) => {
          resolveTenant(req, res, (err) => (err ? reject(err) : resolve()));
        });
        // If response already ended (e.g. 403 or 404 from resolveTenant), stop
        if (res.headersSent) return;
      }

      // 3. Optional contextual resource retrieval
      let resource: any = undefined;
      if (opts?.getResource) {
        resource = await opts.getResource(req);
      }

      // 4. Evaluate permission via engine
      const decision: ICanResult = await can(req.ctx!, code, resource);

      if (!decision.allowed) {
        res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Forbidden access: Insufficient permissions",
          code: "FORBIDDEN",
          permission: code,
          reason: decision.reason,
          error: {
            code: "FORBIDDEN",
            permission: code,
            reason: decision.reason,
          },
          errorMessages: [
            {
              path: "permission",
              message: `Forbidden: Missing required permission ${code}`,
            },
          ],
        });
        return;
      }

      // 5. Attach evaluated scope for service layer consumption
      if (req.ctx) {
        req.ctx.scope = decision.scope as PermissionScope;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  // Tag handler for CI introspection in check-route-guards.ts
  (handler as any).__isPermissionGuard = true;
  (handler as any).__permissionCode = code;

  return handler;
};

/**
 * Route protection middleware requiring at least one of the specified permission codes.
 *
 * @param {string[]} codes - Array of permission codes where any match grants access.
 * @param {RequirePermissionOptions} [opts] - Optional resource loader.
 */
export const requireAnyPermission = (
  codes: string[],
  opts?: RequirePermissionOptions,
) => {
  const handler = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user) {
        await new Promise<void>((resolve, reject) => {
          authenticate(req, res, (err) => (err ? reject(err) : resolve()));
        });
      }

      if (!req.ctx) {
        await new Promise<void>((resolve, reject) => {
          resolveTenant(req, res, (err) => (err ? reject(err) : resolve()));
        });
        if (res.headersSent) return;
      }

      let resource: any = undefined;
      if (opts?.getResource) {
        resource = await opts.getResource(req);
      }

      let matchedDecision: ICanResult | null = null;
      for (const code of codes) {
        const decision = await can(req.ctx!, code, resource);
        if (decision.allowed) {
          matchedDecision = decision;
          break;
        }
      }

      if (!matchedDecision) {
        res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: "Forbidden access: Insufficient permissions",
          code: "FORBIDDEN",
          permissions: codes,
          error: {
            code: "FORBIDDEN",
            permissions: codes,
          },
          errorMessages: [
            {
              path: "permission",
              message: `Forbidden: Requires any of [${codes.join(", ")}]`,
            },
          ],
        });
        return;
      }

      if (req.ctx) {
        req.ctx.scope = matchedDecision.scope as PermissionScope;
      }

      next();
    } catch (error) {
      next(error);
    }
  };

  (handler as any).__isPermissionGuard = true;
  (handler as any).__permissionCodes = codes;

  return handler;
};

/**
 * Backward compatibility helper for legacy routes.
 * If permission codes are passed, maps to requirePermission / requireAnyPermission.
 * If empty, defaults to authenticate + resolveTenant.
 */
export const auth = (...permissions: string[]) => {
  if (permissions.length === 1) {
    return requirePermission(permissions[0]);
  }
  if (permissions.length > 1) {
    return requireAnyPermission(permissions);
  }
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        await new Promise<void>((resolve, reject) => {
          authenticate(req, res, (err) => (err ? reject(err) : resolve()));
        });
      }
      if (!req.ctx) {
        await new Promise<void>((resolve, reject) => {
          resolveTenant(req, res, (err) => (err ? reject(err) : resolve()));
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional authentication middleware: attaches user & context if present, continues otherwise.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tokenWithBearer = req.headers.authorization;
    if (tokenWithBearer && tokenWithBearer.startsWith("Bearer ")) {
      const token = tokenWithBearer.split(" ")[1];
      const isBlacklisted = await cacheHelper.isTokenBlacklisted(token);
      if (!isBlacklisted) {
        const verifyUser = jwtHelper.verifyToken(
          token,
          env.jwt.jwt_secret as Secret,
        );
        req.user = verifyUser;
      }
    }
    next();
  } catch {
    next();
  }
};

// Attach utility methods to auth function for convenience
auth.authenticate = authenticate;
auth.resolveTenant = resolveTenant;
auth.requirePermission = requirePermission;
auth.requireAnyPermission = requireAnyPermission;
auth.optionalAuth = optionalAuth;

export default auth;

