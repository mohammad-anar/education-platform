import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { CourseEnrollmentService } from "./courseEnrollment.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await CourseEnrollmentService.create(req.body, req.ctx);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course Enrollment created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await CourseEnrollmentService.getAll(filters, paginationOptions, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course Enrollments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseEnrollmentService.getById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course Enrollment retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseEnrollmentService.update(id, req.body, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course Enrollment updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseEnrollmentService.deleteById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course Enrollment deleted successfully",
    data: result,
  });
});

const createRestriction = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as any;
  const payload = {
    ...req.body,
    createdById: user?.id || req.body.createdById,
  };
  const result = await CourseEnrollmentService.createRestriction(payload, req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course access restriction created successfully",
    data: result,
  });
});

const revokeRestriction = catchAsync(async (req: Request, res: Response) => {
  const { restrictionId } = req.params;
  const user = req.user as any;
  const payload = {
    ...req.body,
    revokedById: user?.id || req.body.revokedById,
  };
  const result = await CourseEnrollmentService.revokeRestriction(restrictionId, payload, req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course access restriction revoked successfully",
    data: result,
  });
});

export const CourseEnrollmentController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  createRestriction,
  revokeRestriction,
};
