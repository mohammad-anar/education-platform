import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { TeacherService } from "./teacher.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await TeacherService.create(req.body, req.ctx || req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Teacher created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "instituteId",
    "employmentStatus",
    "designation",
  ]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await TeacherService.getAll(filters, paginationOptions, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teachers retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeacherService.getById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher retrieved successfully",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherService.getMyProfile(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My teacher profile retrieved successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherService.updateMyProfile(req.ctx || req, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My teacher profile updated successfully",
    data: result,
  });
});

const adminUpdateProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeacherService.adminUpdateProfile(req.ctx || req, id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher profile updated successfully by admin",
    data: result,
  });
});

const uploadProfilePhoto = catchAsync(async (req: Request, res: Response) => {
  const { fileAssetId } = req.body;
  const result = await TeacherService.uploadProfilePhoto(req.ctx || req, fileAssetId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile photo updated successfully",
    data: result,
  });
});

const addQualification = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherService.addQualification(req.ctx || req, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Qualification added successfully",
    data: result,
  });
});

const removeQualification = catchAsync(async (req: Request, res: Response) => {
  const { qualId } = req.params;
  const result = await TeacherService.removeQualification(req.ctx || req, qualId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message || "Qualification removed successfully",
    data: result,
  });
});

const updateMyNotificationPrefs = catchAsync(async (req: Request, res: Response) => {
  const { notificationPrefs } = req.body;
  const result = await TeacherService.updateMyNotificationPrefs(req.ctx || req, notificationPrefs);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification preferences updated successfully",
    data: result,
  });
});

const updateMyVisibility = catchAsync(async (req: Request, res: Response) => {
  const { visibility } = req.body;
  const result = await TeacherService.updateMyVisibility(req.ctx || req, visibility);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Visibility preferences updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await TeacherService.deleteById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher deleted successfully",
    data: result,
  });
});

export const TeacherController = {
  create,
  getAll,
  getById,
  getMyProfile,
  updateMyProfile,
  adminUpdateProfile,
  uploadProfilePhoto,
  addQualification,
  removeQualification,
  updateMyNotificationPrefs,
  updateMyVisibility,
  update: adminUpdateProfile,
  deleteById,
};

export default TeacherController;
