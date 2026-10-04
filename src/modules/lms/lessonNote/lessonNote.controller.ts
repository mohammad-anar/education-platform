import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { LessonNoteService } from "./lessonNote.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await LessonNoteService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Lesson Note created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "courseId", "moduleId", "lessonId", "studentId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LessonNoteService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson Notes retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonNoteService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson Note retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonNoteService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson Note updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LessonNoteService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Lesson Note deleted successfully",
    data: result,
  });
});

export const LessonNoteController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
