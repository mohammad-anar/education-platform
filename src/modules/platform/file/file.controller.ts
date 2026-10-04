import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { FileService } from "./file.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await FileService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "File Asset created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await FileService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File Assets retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await FileService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File Asset retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await FileService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File Asset updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await FileService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "File Asset deleted successfully",
    data: result,
  });
});

export const FileController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
