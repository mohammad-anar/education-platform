import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { CourseService } from "./course.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await CourseService.create(req.body, req.ctx);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "subjectId", "status", "isPublic"]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await CourseService.getAll(filters, paginationOptions, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Courses retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseService.getById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course details and curriculum retrieved successfully",
    data: result,
  });
});

/**
 * @deprecated Superseded by GET /api/v1/dashboard/teacher/course-completion-funnel or admin LMS analytics
 */
const getStats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseService.getStats(id, req.ctx);
  res.setHeader("Warning", '299 - "Deprecated API: use teacher course funnel or admin LMS analytics instead"');
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course analytics & enrollment stats retrieved successfully (Deprecated: use teacher or admin dashboard)",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseService.update(id, req.body, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseService.deleteById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course deleted successfully",
    data: result,
  });
});

export const CourseController = {
  create,
  getAll,
  getById,
  getStats,
  update,
  deleteById,
};
