import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { CourseService } from "./course.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "subjectId", "status", "isPublic"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await CourseService.getAll(filters, paginationOptions);
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
  const result = await CourseService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course details and curriculum retrieved successfully",
    data: result,
  });
});

const getStats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseService.getStats(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course analytics & enrollment stats retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseService.deleteById(id);
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
