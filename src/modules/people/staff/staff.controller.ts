import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { StaffService } from "./staff.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await StaffService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Staff created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await StaffService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staffs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StaffService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StaffService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await StaffService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Staff deleted successfully",
    data: result,
  });
});

export const StaffController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
