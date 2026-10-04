import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { LessonVideoService } from "./lessonVideo.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await LessonVideoService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Lesson Video created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "courseId", "moduleId", "lessonId", "studentId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LessonVideoService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson Videos retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonVideoService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson Video retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonVideoService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson Video updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonVideoService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson Video deleted successfully",
    data: result,
  });
});

export const LessonVideoController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
