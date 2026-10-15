import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { SettingsService } from "./settings.service.js";
import { InstituteSettingsSection } from "./settings.interface.js";

// ==========================================
// 1. USER SETTINGS & SECURITY CONTROLLERS
// ==========================================

export const getMySettings = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.getMySettings(req.ctx!);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User settings retrieved successfully",
    data: result,
  });
});

export const updateMySettings = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.updateMySettings(req.ctx!, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User settings updated successfully",
    data: result,
  });
});

export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.changePassword(req.ctx!, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const enable2FA = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.enable2FA(req.ctx!);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Two-factor authentication setup initiated",
    data: result,
  });
});

export const verify2FA = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.verify2FA(req.ctx!, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: { backupCodes: result.backupCodes },
  });
});

export const disable2FA = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.disable2FA(req.ctx!, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

// ==========================================
// 2. SESSIONS CONTROLLERS
// ==========================================

export const listMySessions = catchAsync(async (req: Request, res: Response) => {
  const rawAuth = req.headers.authorization;
  const currentToken = rawAuth?.startsWith("Bearer ") ? rawAuth.split(" ")[1] : undefined;
  const result = await SettingsService.listMySessions(req.ctx!, currentToken);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User sessions retrieved successfully",
    data: result,
  });
});

export const revokeSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SettingsService.revokeSession(req.ctx!, id as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

// ==========================================
// 3. INSTITUTE SETTINGS CONTROLLERS
// ==========================================

export const getInstituteSettings = catchAsync(async (req: Request, res: Response) => {
  const instituteId = req.ctx?.instituteId || "";
  const result = await SettingsService.getInstituteSettings(instituteId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Institute settings retrieved successfully",
    data: result,
  });
});

export const updateInstituteSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await SettingsService.updateInstituteSettings(req.ctx!, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Institute settings updated successfully",
    data: result,
  });
});

export const getInstituteSectionSettings = catchAsync(async (req: Request, res: Response) => {
  const instituteId = req.ctx?.instituteId || "";
  const section = req.params.section as InstituteSettingsSection;
  const result = await SettingsService.getInstituteSectionSettings(instituteId, section);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Institute ${section} settings retrieved successfully`,
    data: result,
  });
});

export const updateInstituteSectionSettings = catchAsync(async (req: Request, res: Response) => {
  const section = req.params.section as InstituteSettingsSection;
  const result = await SettingsService.updateInstituteSectionSettings(req.ctx!, section, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Institute ${section} settings updated successfully`,
    data: result,
  });
});

export const SettingsController = {
  getMySettings,
  updateMySettings,
  changePassword,
  enable2FA,
  verify2FA,
  disable2FA,
  listMySessions,
  revokeSession,
  getInstituteSettings,
  updateInstituteSettings,
  getInstituteSectionSettings,
  updateInstituteSectionSettings,
};

export default SettingsController;
