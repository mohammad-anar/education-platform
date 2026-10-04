import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { PermissionService } from "./permission.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await PermissionService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Permission created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await PermissionService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Permissions retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PermissionService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Permission retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PermissionService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Permission updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PermissionService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Permission deleted successfully",
    data: result,
  });
});

export const PermissionController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
