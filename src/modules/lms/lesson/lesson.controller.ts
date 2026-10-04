import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { LessonService } from "./lesson.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await LessonService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Lesson created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LessonService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lessons retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson deleted successfully",
    data: result,
  });
});

export const LessonController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
