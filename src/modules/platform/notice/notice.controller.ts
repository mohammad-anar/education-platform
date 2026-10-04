import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { NoticeService } from "./notice.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await NoticeService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Notice created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await NoticeService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notices retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notice retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notice updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Notice deleted successfully",
    data: result,
  });
});

export const NoticeController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
