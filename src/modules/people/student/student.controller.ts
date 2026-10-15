import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { StudentService } from "./student.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await StudentService.create(req.body, req.ctx || req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Student created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "instituteId",
    "status",
    "gender",
    "bloodGroup",
    "studentCode",
    "admissionNo",
  ]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await StudentService.getAll(filters, paginationOptions, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Students retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.getById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student retrieved successfully",
    data: result,
  });
});

/**
 * @deprecated Superseded by GET /api/v1/student-portal or GET /api/v1/dashboard/guardian/children/:childId
 */
const getStats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.getStats(id, req.ctx || req);
  res.setHeader("Warning", '299 - "Deprecated API: use student-portal or guardian dashboard instead"');
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student stats retrieved successfully (Deprecated: use student-portal or guardian dashboard)",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.getMyProfile(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My student profile retrieved successfully",
    data: result,
  });
});

const updateMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.updateMyProfile(req.ctx || req, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My student profile updated successfully",
    data: result,
  });
});

const adminUpdateProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.adminUpdateProfile(req.ctx || req, id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student profile updated successfully by admin",
    data: result,
  });
});

const uploadProfilePhoto = catchAsync(async (req: Request, res: Response) => {
  const { fileAssetId } = req.body;
  const result = await StudentService.uploadProfilePhoto(req.ctx || req, fileAssetId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Profile photo updated successfully",
    data: result,
  });
});

const addDocument = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentService.addDocument(req.ctx || req, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Document added successfully",
    data: result,
  });
});

const removeDocument = catchAsync(async (req: Request, res: Response) => {
  const { docId } = req.params;
  const result = await StudentService.removeDocument(req.ctx || req, docId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message || "Document removed successfully",
    data: result,
  });
});

const updateMyNotificationPrefs = catchAsync(async (req: Request, res: Response) => {
  const { notificationPrefs } = req.body;
  const result = await StudentService.updateMyNotificationPrefs(req.ctx || req, notificationPrefs);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notification preferences updated successfully",
    data: result,
  });
});

const updateMyVisibility = catchAsync(async (req: Request, res: Response) => {
  const { visibility } = req.body;
  const result = await StudentService.updateMyVisibility(req.ctx || req, visibility);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Visibility preferences updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StudentService.deleteById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student deleted successfully",
    data: result,
  });
});

export const StudentController = {
  create,
  getAll,
  getById,
  getStats,
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

export default StudentController;
