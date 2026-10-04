import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { RoleService } from "./role.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await RoleService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Role created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await RoleService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Roles retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RoleService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RoleService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RoleService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role deleted successfully",
    data: result,
  });
});

export const RoleController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
