import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Secret } from "jsonwebtoken";
import env from "../config/env.js";
import ApiError from "../utils/ApiError.js";
import { jwtHelper } from "../utils/jwt.js";
import cacheHelper from "../utils/cache.js";

/**
 * Role-based authentication guard with Redis token blacklisting check
 */
export const auth =
  (...roles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
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

      // Check if token has been revoked / logged out in Redis
      const isBlacklisted = await cacheHelper.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new ApiError(StatusCodes.UNAUTHORIZED, "Token has been revoked. Please log in again.");
      }

      // Verify token
      const verifyUser = jwtHelper.verifyToken(
        token,
        env.jwt.jwt_secret as Secret,
      );

      // Attach user to request
      req.user = verifyUser;

      // Role check (matches if user has any of the requested roles or SUPER_ADMIN)
      if (roles.length > 0) {
        const userRoles: string[] = Array.isArray(verifyUser.roles)
          ? verifyUser.roles
          : verifyUser.role
          ? [verifyUser.role]
          : [];

        const hasPermission =
          userRoles.includes("SUPER_ADMIN") ||
          roles.some((requiredRole) => userRoles.includes(requiredRole));

        if (!hasPermission) {
          throw new ApiError(
            StatusCodes.FORBIDDEN,
            "You don't have permission to access this resource",
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };

/**
 * Optional authentication middleware: attaches user if valid token exists, otherwise proceeds as guest
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
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
    // Silently continue for optional auth
    next();
  }
};

export default auth;
