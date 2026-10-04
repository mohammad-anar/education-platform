import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { InstituteService } from "./institute.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await InstituteService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Institute created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await InstituteService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Institutes retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InstituteService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Institute retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InstituteService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Institute updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await InstituteService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Institute deleted successfully",
    data: result,
  });
});

export const InstituteController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
