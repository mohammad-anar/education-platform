import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { ClassGroupService } from "./classGroup.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await ClassGroupService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Class Group created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await ClassGroupService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class Groups retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ClassGroupService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class Group retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ClassGroupService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class Group updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ClassGroupService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Class Group deleted successfully",
    data: result,
  });
});

export const ClassGroupController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
