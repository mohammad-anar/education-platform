import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { AssessmentService } from "./assessment.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await AssessmentService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Assessment created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await AssessmentService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Assessments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssessmentService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Assessment retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssessmentService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Assessment updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AssessmentService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Assessment deleted successfully",
    data: result,
  });
});

export const AssessmentController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
