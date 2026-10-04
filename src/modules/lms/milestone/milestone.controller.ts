import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { MilestoneService } from "./milestone.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await MilestoneService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Milestone created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "courseId", "moduleId", "lessonId", "studentId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await MilestoneService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Milestones retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MilestoneService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Milestone retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MilestoneService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Milestone updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MilestoneService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Milestone deleted successfully",
    data: result,
  });
});

export const MilestoneController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
