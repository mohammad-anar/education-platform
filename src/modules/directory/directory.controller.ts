import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import pick from "../../utils/pick.js";
import { DirectoryService } from "./directory.service.js";

const getTeachers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "subjectId",
    "departmentId",
    "designationId",
    "acceptsSupportSessions",
  ]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await DirectoryService.getTeachersDirectory(
    filters,
    paginationOptions,
    req.ctx || req,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teachers directory retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getTeacherById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await DirectoryService.getTeacherById(id, req.ctx || req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher profile retrieved successfully",
    data: result,
  });
});

const getStaff = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "departmentId",
    "designationId",
    "staffType",
    "acceptsSupportSessions",
  ]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await DirectoryService.getStaffDirectory(
    filters,
    paginationOptions,
    req.ctx || req,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff directory retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getInstitutePublicProfile = catchAsync(async (req: Request, res: Response) => {
  const explicitInstituteId = (req.query.instituteId as string) || (req.params.id as string);
  const result = await DirectoryService.getInstitutePublicProfile(
    req.ctx || req,
    explicitInstituteId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Institute public profile retrieved successfully",
    data: result,
  });
});

const updateTeacherVisibility = catchAsync(async (req: Request, res: Response) => {
  const { visibility } = req.body;
  const result = await DirectoryService.updateTeacherVisibility(req.ctx || req, visibility);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Teacher visibility settings updated successfully",
    data: result,
  });
});

const updateInstituteContactVisibility = catchAsync(async (req: Request, res: Response) => {
  const { contactVisibility } = req.body;
  const result = await DirectoryService.updateInstituteContactVisibility(
    req.ctx || req,
    contactVisibility,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Institute contact visibility updated successfully",
    data: result,
  });
});

export const DirectoryController = {
  getTeachers,
  getTeacherById,
  getStaff,
  getInstitutePublicProfile,
  updateTeacherVisibility,
  updateInstituteContactVisibility,
};

export default DirectoryController;
