import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { CalendarService } from "./calendar.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await CalendarService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Attendance calendar plan created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "searchTerm",
    "instituteId",
    "academicYearId",
    "classGroupId",
    "sectionId",
    "subjectId",
    "courseId",
    "status",
  ]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await CalendarService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance calendars retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CalendarService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance calendar details and schedule retrieved successfully",
    data: result,
  });
});

const generateSessions = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CalendarService.generateSessions(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance sessions generated successfully from calendar rules",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CalendarService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance calendar updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CalendarService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance calendar deleted successfully",
    data: result,
  });
});

export const CalendarController = {
  create,
  getAll,
  getById,
  generateSessions,
  update,
  deleteById,
};
