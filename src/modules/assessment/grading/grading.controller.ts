import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { GradingService } from "./grading.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await GradingService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Grading System created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await GradingService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grading Systems retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GradingService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grading System retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GradingService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grading System updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GradingService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Grading System deleted successfully",
    data: result,
  });
});

export const GradingController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
