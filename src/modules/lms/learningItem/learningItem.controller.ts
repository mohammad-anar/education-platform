import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { LearningItemService } from "./learningItem.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await LearningItemService.create(req.body, req.ctx);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Learning Item created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "courseId", "moduleId", "lessonId", "studentId", "status"]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LearningItemService.getAll(filters, paginationOptions, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Learning Items retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LearningItemService.getById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Learning Item retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LearningItemService.update(id, req.body, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Learning Item updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LearningItemService.deleteById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Learning Item deleted successfully",
    data: result,
  });
});

export const LearningItemController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
