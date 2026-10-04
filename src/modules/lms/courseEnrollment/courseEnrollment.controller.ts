import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { CourseEnrollmentService } from "./courseEnrollment.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await CourseEnrollmentService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Course Enrollment created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await CourseEnrollmentService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course Enrollments retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseEnrollmentService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course Enrollment retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseEnrollmentService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course Enrollment updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CourseEnrollmentService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Course Enrollment deleted successfully",
    data: result,
  });
});

export const CourseEnrollmentController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
