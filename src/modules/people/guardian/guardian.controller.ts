import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { GuardianService } from "./guardian.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await GuardianService.create(req.body, req.ctx);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Guardian created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await GuardianService.getAll(filters, paginationOptions, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guardians retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GuardianService.getById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guardian retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GuardianService.update(id, req.body, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guardian updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await GuardianService.deleteById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Guardian deleted successfully",
    data: result,
  });
});

export const GuardianController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
