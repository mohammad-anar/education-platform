import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { LevelService } from "./level.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await LevelService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Level created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LevelService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Levels retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LevelService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Level retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LevelService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Level updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LevelService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Level deleted successfully",
    data: result,
  });
});

export const LevelController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
