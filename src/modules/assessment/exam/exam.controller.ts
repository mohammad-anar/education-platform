import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { ExamService } from "./exam.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await ExamService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Exam created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await ExamService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Exams retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ExamService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Exam retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ExamService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Exam updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ExamService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Exam deleted successfully",
    data: result,
  });
});

export const ExamController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
