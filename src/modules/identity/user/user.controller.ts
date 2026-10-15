import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { UserService } from "./user.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await UserService.create(req.body, req.ctx || req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await UserService.getAll(filters, paginationOptions, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.update(id, req.body, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

const assignRole = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { roleId } = req.body;
  const result = await UserService.assignRole(req.ctx || req, id, roleId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role assigned successfully",
    data: result,
  });
});

const revokeRole = catchAsync(async (req: Request, res: Response) => {
  const { id, roleId } = req.params;
  const result = await UserService.revokeRole(req.ctx || req, id, roleId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message || "Role revoked successfully",
    data: result,
  });
});

const grantUserPermission = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.grantUserPermission(req.ctx || req, id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User permission override configured successfully",
    data: result,
  });
});

const listUserPermissionOverrides = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.listUserPermissionOverrides(req.ctx || req, id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User permission overrides retrieved successfully",
    data: result,
  });
});

const revokeUserPermissionOverride = catchAsync(async (req: Request, res: Response) => {
  const { id, overrideId } = req.params;
  const result = await UserService.revokeUserPermissionOverride(req.ctx || req, id, overrideId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message || "User permission override revoked successfully",
    data: result,
  });
});

const getUserEffectivePermissions = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getUserEffectivePermissions(req.ctx || req, id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User effective permissions breakdown retrieved successfully",
    data: result,
  });
});

export const UserController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  assignRole,
  revokeRole,
  grantUserPermission,
  listUserPermissionOverrides,
  revokeUserPermissionOverride,
  getUserEffectivePermissions,
};

export default UserController;
