import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import { StatusCodes } from "http-status-codes";
import TeacherDashboardService from "./teacher-dashboard.service.js";
import AdminDashboardService from "./admin-dashboard.service.js";
import GuardianDashboardService from "./guardian-dashboard.service.js";

// ==========================================
// 1. TEACHER DASHBOARD CONTROLLERS
// ==========================================

const getTeacherDashboard = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getTeacherDashboard((req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Teacher dashboard retrieved successfully",
    data: result,
  });
});

const getTodayClasses = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getTodayClasses((req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Today's scheduled classes retrieved successfully",
    data: result,
  });
});

const getPendingAttendance = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getPendingAttendance((req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pending attendance sessions retrieved successfully",
    data: result,
  });
});

const getPendingGrading = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getPendingGrading((req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Pending grading submissions retrieved successfully",
    data: result,
  });
});

const getClassAttendanceStats = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getClassAttendanceStats(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Class attendance statistics retrieved successfully",
    data: result,
  });
});

const getAssignmentSubmissionRate = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getAssignmentSubmissionRate(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Assignment submission rate retrieved successfully",
    data: result,
  });
});

const getQuizPerformance = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getQuizPerformance(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Quiz performance distribution retrieved successfully",
    data: result,
  });
});

const getCourseCompletionFunnel = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getCourseCompletionFunnel(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Course completion funnel retrieved successfully",
    data: result,
  });
});

const getAtRiskStudents = catchAsync(async (req: Request, res: Response) => {
  const result = await TeacherDashboardService.getAtRiskStudents(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "At-risk students retrieved successfully",
    data: result,
  });
});

// ==========================================
// 2. ADMIN DASHBOARD CONTROLLERS
// ==========================================

const getAdminDashboard = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getAdminDashboard((req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Admin dashboard retrieved successfully",
    data: result,
  });
});

const getEnrollmentTrend = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getEnrollmentTrend(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Enrollment trend retrieved successfully",
    data: result,
  });
});

const getAttendanceRate = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getAttendanceRate(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Institute attendance rate retrieved successfully",
    data: result,
  });
});

const getResultPassRate = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getResultPassRate(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Result pass rate retrieved successfully",
    data: result,
  });
});

const getLmsEngagement = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getLmsEngagement(
    (req as any).ctx,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "LMS engagement metrics retrieved successfully",
    data: result,
  });
});

const getTeacherWorkload = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getTeacherWorkload((req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Teacher workload distribution retrieved successfully",
    data: result,
  });
});

const getSupportStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminDashboardService.getSupportStats((req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support statistics retrieved successfully",
    data: result,
  });
});

// ==========================================
// 3. GUARDIAN DASHBOARD CONTROLLERS
// ==========================================

const getGuardianDashboard = catchAsync(async (req: Request, res: Response) => {
  const childId = req.params.childId || (req.query.childId as string);
  const result = await GuardianDashboardService.getGuardianDashboard(
    (req as any).ctx,
    childId,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Guardian dashboard retrieved successfully",
    data: result,
  });
});

const listChildren = catchAsync(async (req: Request, res: Response) => {
  const result = await GuardianDashboardService.listChildren((req as any).ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Registered wards retrieved successfully",
    data: result,
  });
});

const getChildAttendance = catchAsync(async (req: Request, res: Response) => {
  const { childId } = req.params;
  const result = await GuardianDashboardService.getChildAttendance(
    (req as any).ctx,
    childId,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Child attendance history retrieved successfully",
    data: result,
  });
});

const getChildResults = catchAsync(async (req: Request, res: Response) => {
  const { childId } = req.params;
  const result = await GuardianDashboardService.getChildResults(
    (req as any).ctx,
    childId,
    req.query as any,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Child academic results retrieved successfully",
    data: result,
  });
});

const getChildNotices = catchAsync(async (req: Request, res: Response) => {
  const { childId } = req.params;
  const result = await GuardianDashboardService.getChildNotices((req as any).ctx, childId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Child targeted notices retrieved successfully",
    data: result,
  });
});

export const DashboardController = {
  // Teacher
  getTeacherDashboard,
  getTodayClasses,
  getPendingAttendance,
  getPendingGrading,
  getClassAttendanceStats,
  getAssignmentSubmissionRate,
  getQuizPerformance,
  getCourseCompletionFunnel,
  getAtRiskStudents,

  // Admin
  getAdminDashboard,
  getEnrollmentTrend,
  getAttendanceRate,
  getResultPassRate,
  getLmsEngagement,
  getTeacherWorkload,
  getSupportStats,

  // Guardian
  getGuardianDashboard,
  listChildren,
  getChildAttendance,
  getChildResults,
  getChildNotices,
};

export default DashboardController;
