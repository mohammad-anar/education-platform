import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { MarkingSchemeService } from "./markingScheme.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await MarkingSchemeService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Marking Scheme created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await MarkingSchemeService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Marking Schemes retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MarkingSchemeService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Marking Scheme retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MarkingSchemeService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Marking Scheme updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await MarkingSchemeService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Marking Scheme deleted successfully",
    data: result,
  });
});

export const MarkingSchemeController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
