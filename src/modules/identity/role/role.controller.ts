import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { RoleService } from "./role.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await RoleService.create(req.body, req.ctx || req);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Role created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await RoleService.getAll(filters, paginationOptions, req.ctx || req);
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
  const result = await RoleService.getById(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RoleService.update(id, req.body, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const reassignToRoleId =
    req.body?.reassignToRoleId || (req.query?.reassignToRoleId as string) || undefined;
  const result = await RoleService.deleteById(id, { reassignToRoleId }, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message || "Role deleted successfully",
    data: result,
  });
});

const getRoleMatrix = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RoleService.getRoleMatrix(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role permission matrix retrieved successfully",
    data: result,
  });
});

const setRoleMatrix = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { permissions } = req.body;
  const result = await RoleService.setRoleMatrix(id, permissions, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role permission matrix updated successfully",
    data: result,
  });
});

const previewRoleImpact = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await RoleService.previewRoleImpact(id, req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Role impact preview retrieved successfully",
    data: result,
  });
});

export const RoleController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  getRoleMatrix,
  setRoleMatrix,
  previewRoleImpact,
  updatePermissions: setRoleMatrix, // Backward compatibility alias
};

export default RoleController;
