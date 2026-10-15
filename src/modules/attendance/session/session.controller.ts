import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { SessionService } from "./session.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await SessionService.create(req.body, req.ctx);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Attendance Session created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await SessionService.getAll(filters, paginationOptions, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance Sessions retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SessionService.getById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance Session retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SessionService.update(id, req.body, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance Session updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SessionService.deleteById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance Session deleted successfully",
    data: result,
  });
});

const markAttendance = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const records = req.body.records || (Array.isArray(req.body) ? req.body : [req.body]);
  const result = await SessionService.markAttendance(id, records, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance marked successfully",
    data: result,
  });
});

export const SessionController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  markAttendance,
};
