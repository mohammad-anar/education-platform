import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { StaffService } from "./staff.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await StaffService.create(req.body, req.ctx || req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Staff created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "instituteId",
    "employmentStatus",
    "departmentId",
    "designationId",
    "staffType",
  ]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await StaffService.getAll(filters, paginationOptions, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staffs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StaffService.getById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff retrieved successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.getMyProfile(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My staff profile retrieved successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.updateMyProfile(req.ctx || req, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My staff profile updated successfully",
    data: result,
  });
});

const adminUpdateProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StaffService.adminUpdateProfile(req.ctx || req, id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff profile updated successfully by admin",
    data: result,
  });
});

const uploadProfilePhoto = catchAsync(async (req: Request, res: Response) => {
  const { fileAssetId } = req.body;
  const result = await StaffService.uploadProfilePhoto(req.ctx || req, fileAssetId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile photo updated successfully",
    data: result,
  });
});

const addDocument = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.addDocument(req.ctx || req, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Document added successfully",
    data: result,
  });
});

const removeDocument = catchAsync(async (req: Request, res: Response) => {
  const { docId } = req.params;
  const result = await StaffService.removeDocument(req.ctx || req, docId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message || "Document removed successfully",
    data: result,
  });
});

const updateMyNotificationPrefs = catchAsync(async (req: Request, res: Response) => {
  const { notificationPrefs } = req.body;
  const result = await StaffService.updateMyNotificationPrefs(req.ctx || req, notificationPrefs);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification preferences updated successfully",
    data: result,
  });
});

const updateMyVisibility = catchAsync(async (req: Request, res: Response) => {
  const { visibility } = req.body;
  const result = await StaffService.updateMyVisibility(req.ctx || req, visibility);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Visibility preferences updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StaffService.deleteById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff member deleted successfully",
    data: result,
  });
});

export const StaffController = {
  create,
  getAll,
  getById,
  getMyProfile,
  updateMyProfile,
  adminUpdateProfile,
  uploadProfilePhoto,
  addDocument,
  removeDocument,
  updateMyNotificationPrefs,
  updateMyVisibility,
  update: adminUpdateProfile,
  deleteById,
};

export default StaffController;
