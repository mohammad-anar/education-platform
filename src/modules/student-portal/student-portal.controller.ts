import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { StudentPortalService } from "./student-portal.service.js";

const getDashboard = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getStudentDashboard(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Student dashboard retrieved successfully",
    data: result,
  });
});

const getTodaySummary = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getTodaySummary(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Today's routine summary retrieved successfully",
    data: result,
  });
});

const getAttendanceHistory = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getAttendanceHistory(req.ctx || req, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance history retrieved successfully",
    data: result,
  });
});

const getAttendanceCalendar = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getAttendanceCalendar(req.ctx || req, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Attendance heatmap calendar retrieved successfully",
    data: result,
  });
});

const getSubjectAttendanceSummary = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getSubjectAttendanceSummary(req.ctx || req, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subject attendance summary retrieved successfully",
    data: result,
  });
});

const getSubjectProgress = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getSubjectProgress(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subject and course progress retrieved successfully",
    data: result,
  });
});

const getOverdueItems = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getOverdueItems(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Overdue items retrieved successfully",
    data: result,
  });
});

const getUpcomingItems = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getUpcomingItems(req.ctx || req, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Upcoming items retrieved successfully",
    data: result,
  });
});

const getContinueLearning = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getContinueLearning(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Continue learning item retrieved successfully",
    data: result,
  });
});

const getPerformanceTrend = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getPerformanceTrend(req.ctx || req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Performance trend retrieved successfully",
    data: result,
  });
});

const getStudyActivity = catchAsync(async (req: Request, res: Response) => {
  const result = await StudentPortalService.getStudyActivity(req.ctx || req, req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Study activity retrieved successfully",
    data: result,
  });
});

export const StudentPortalController = {
  getDashboard,
  getTodaySummary,
  getAttendanceHistory,
  getAttendanceCalendar,
  getSubjectAttendanceSummary,
  getSubjectProgress,
  getOverdueItems,
  getUpcomingItems,
  getContinueLearning,
  getPerformanceTrend,
  getStudyActivity,
};

export default StudentPortalController;
