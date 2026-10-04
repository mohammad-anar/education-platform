import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { LiveClassService } from "./liveClass.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await LiveClassService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Live Class created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LiveClassService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Live Classs retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LiveClassService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Live Class retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LiveClassService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Live Class updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LiveClassService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Live Class deleted successfully",
    data: result,
  });
});

export const LiveClassController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
