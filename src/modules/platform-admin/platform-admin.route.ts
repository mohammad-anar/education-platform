import express, { NextFunction, Request, Response } from "express";
import validateRequest from "../../middleware/validate.middleware.js";
import { requirePermission } from "../../middleware/auth.middleware.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import PlatformAdminController from "./platform-admin.controller.js";
import PlatformAdminValidation from "./platform-admin.validation.js";

const router = express.Router();

/**
 * Strict platform administrator gate.
 * Ensures non-platform users receive an immediate 403 Forbidden.
 */
export const requirePlatformAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.ctx?.isPlatformAdmin) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "Access forbidden: Platform Administrator privilege required.",
    );
  }
  next();
};

// Global gate for all platform-admin endpoints
router.use(requirePlatformAdmin);

// ==========================================
// 1. BUSINESS KPIS & FINANCIAL ANALYTICS
// ==========================================

router.get(
  "/kpis",
  requirePermission("platform.admin.read"),
  PlatformAdminController.getPlatformKpis,
);

router.get(
  "/revenue-trend",
  requirePermission("platform.admin.read"),
  PlatformAdminController.getRevenueTrend,
);

router.get(
  "/payments/failed",
  requirePermission("platform.admin.read"),
  PlatformAdminController.getFailedPayments,
);

router.get(
  "/renewals/upcoming",
  requirePermission("platform.admin.read"),
  validateRequest(PlatformAdminValidation.upcomingRenewalsQueryZodSchema),
  PlatformAdminController.getUpcomingRenewals,
);

// ==========================================
// 2. TENANT OPERATIONS & USAGE
// ==========================================

router.get(
  "/tenants",
  requirePermission("platform.admin.read"),
  validateRequest(PlatformAdminValidation.tenantFilterQueryZodSchema),
  PlatformAdminController.listTenants,
);

router.get(
  "/tenants/top-active",
  requirePermission("platform.admin.read"),
  PlatformAdminController.getTopActiveTenants,
);

router.get(
  "/tenants/:tenantId",
  requirePermission("platform.admin.read"),
  validateRequest(PlatformAdminValidation.tenantIdParamZodSchema),
  PlatformAdminController.getTenantDetail,
);

router.get(
  "/tenants/:tenantId/usage",
  requirePermission("platform.admin.read"),
  validateRequest(PlatformAdminValidation.tenantIdParamZodSchema),
  PlatformAdminController.getUsageVsLimit,
);

router.patch(
  "/tenants/:tenantId/suspend",
  requirePermission("platform.admin.manage"),
  validateRequest(PlatformAdminValidation.suspendTenantZodSchema),
  PlatformAdminController.suspendTenant,
);

router.patch(
  "/tenants/:tenantId/activate",
  requirePermission("platform.admin.manage"),
  validateRequest(PlatformAdminValidation.tenantIdParamZodSchema),
  PlatformAdminController.activateTenant,
);

router.patch(
  "/tenants/:tenantId/plan",
  requirePermission("platform.admin.manage"),
  validateRequest(PlatformAdminValidation.changePlanZodSchema),
  PlatformAdminController.changeTenantPlan,
);

// ==========================================
// 3. IMPERSONATION ENGINE
// ==========================================

router.post(
  "/impersonate/start",
  requirePermission("platform.admin.manage"),
  validateRequest(PlatformAdminValidation.impersonateStartZodSchema),
  PlatformAdminController.impersonateStart,
);

router.post(
  "/impersonate/end",
  requirePermission("platform.admin.manage"),
  validateRequest(PlatformAdminValidation.impersonateEndZodSchema),
  PlatformAdminController.impersonateEnd,
);

// ==========================================
// 4. AUDIT TRAIL LOGGING
// ==========================================

router.get(
  "/audit-logs",
  requirePermission("platform.admin.read"),
  validateRequest(PlatformAdminValidation.auditLogFilterQueryZodSchema),
  PlatformAdminController.getAuditLogs,
);

export const PlatformAdminRoutes = router;
export default PlatformAdminRoutes;
