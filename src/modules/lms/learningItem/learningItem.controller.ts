import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { LearningItemService } from "./learningItem.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await LearningItemService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Learning Item created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "courseId", "moduleId", "lessonId", "studentId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LearningItemService.getAll(filters, paginationOptions);
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
  const result = await LearningItemService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Learning Item retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LearningItemService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Learning Item updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LearningItemService.deleteById(id);
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
