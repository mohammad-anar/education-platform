import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { PolicyService } from "./policy.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await PolicyService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Attendance Policy created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await PolicyService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance Policys retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PolicyService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance Policy retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PolicyService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance Policy updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PolicyService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance Policy deleted successfully",
    data: result,
  });
});

export const PolicyController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
