import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import PlatformAdminService from "./platform-admin.service.js";

const listTenants = catchAsync(async (req: Request, res: Response) => {
  const result = await PlatformAdminService.listTenants(req.query as any, (req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenants retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getTenantDetail = catchAsync(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const result = await PlatformAdminService.getTenantDetail(tenantId, (req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenant details retrieved successfully",
    data: result,
  });
});

const suspendTenant = catchAsync(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { reason } = req.body;
  const result = await PlatformAdminService.suspendTenant(tenantId, reason, (req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenant suspended successfully",
    data: result,
  });
});

const activateTenant = catchAsync(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const result = await PlatformAdminService.activateTenant(tenantId, (req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenant reactivated successfully",
    data: result,
  });
});

const changeTenantPlan = catchAsync(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const { planId, billingCycle } = req.body;
  const result = await PlatformAdminService.changeTenantPlan(
    tenantId,
    planId,
    billingCycle,
    (req as any).ctx,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenant subscription plan updated successfully",
    data: result,
  });
});

const getPlatformKpis = catchAsync(async (req: Request, res: Response) => {
  const result = await PlatformAdminService.getPlatformKpis();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Platform KPIs retrieved successfully",
    data: result,
  });
});

const getRevenueTrend = catchAsync(async (req: Request, res: Response) => {
  const result = await PlatformAdminService.getRevenueTrend(req.query.period as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Platform revenue trend retrieved successfully",
    data: result,
  });
});

const getUsageVsLimit = catchAsync(async (req: Request, res: Response) => {
  const { tenantId } = req.params;
  const result = await PlatformAdminService.getUsageVsLimit(tenantId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tenant resource usage and plan limits retrieved successfully",
    data: result,
  });
});

const getFailedPayments = catchAsync(async (req: Request, res: Response) => {
  const result = await PlatformAdminService.getFailedPayments();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Failed payments retrieved successfully",
    data: result,
  });
});

const getUpcomingRenewals = catchAsync(async (req: Request, res: Response) => {
  const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
  const result = await PlatformAdminService.getUpcomingRenewals(days);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Upcoming renewals retrieved successfully",
    data: result,
  });
});

const getTopActiveTenants = catchAsync(async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const result = await PlatformAdminService.getTopActiveTenants(limit);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Top active tenants retrieved successfully",
    data: result,
  });
});

const impersonateStart = catchAsync(async (req: Request, res: Response) => {
  const result = await PlatformAdminService.impersonateStart(req.body, (req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Impersonation session started successfully",
    data: result,
  });
});

const impersonateEnd = catchAsync(async (req: Request, res: Response) => {
  const { impersonationToken } = req.body;
  const result = await PlatformAdminService.impersonateEnd(impersonationToken, (req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
  });
});

const getAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await PlatformAdminService.getAuditLogs(req.query as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Audit logs retrieved successfully",
    data: result,
  });
});

export const PlatformAdminController = {
  listTenants,
  getTenantDetail,
  suspendTenant,
  activateTenant,
  changeTenantPlan,
  getPlatformKpis,
  getRevenueTrend,
  getUsageVsLimit,
  getFailedPayments,
  getUpcomingRenewals,
  getTopActiveTenants,
  impersonateStart,
  impersonateEnd,
  getAuditLogs,
};

export default PlatformAdminController;
