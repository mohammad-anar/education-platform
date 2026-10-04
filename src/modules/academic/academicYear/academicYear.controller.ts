import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { AcademicYearService } from "./academicYear.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await AcademicYearService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Academic Year created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await AcademicYearService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic Years retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AcademicYearService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic Year retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AcademicYearService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic Year updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AcademicYearService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Academic Year deleted successfully",
    data: result,
  });
});

export const AcademicYearController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
