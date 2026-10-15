import express from "express";
import validateRequest from "../../middleware/validate.middleware.js";
import { requirePermission } from "../../middleware/auth.middleware.js";
import DashboardController from "./dashboard.controller.js";
import DashboardValidation from "./dashboard.validation.js";

const router = express.Router();

// ==========================================
// 1. TEACHER DASHBOARD (scope ASSIGNED)
// ==========================================

router.get(
  "/teacher",
  requirePermission("teacher.dashboard.view"),
  DashboardController.getTeacherDashboard,
);

router.get(
  "/teacher/today-classes",
  requirePermission("teacher.dashboard.view"),
  DashboardController.getTodayClasses,
);

router.get(
  "/teacher/pending-attendance",
  requirePermission("teacher.dashboard.view"),
  DashboardController.getPendingAttendance,
);

router.get(
  "/teacher/pending-grading",
  requirePermission("teacher.dashboard.view"),
  DashboardController.getPendingGrading,
);

router.get(
  "/teacher/class-attendance-stats",
  requirePermission("teacher.dashboard.view"),
  validateRequest(DashboardValidation.teacherFilterQueryZodSchema),
  DashboardController.getClassAttendanceStats,
);

router.get(
  "/teacher/assignment-submission-rate",
  requirePermission("teacher.dashboard.view"),
  validateRequest(DashboardValidation.teacherFilterQueryZodSchema),
  DashboardController.getAssignmentSubmissionRate,
);

router.get(
  "/teacher/quiz-performance",
  requirePermission("teacher.dashboard.view"),
  validateRequest(DashboardValidation.teacherFilterQueryZodSchema),
  DashboardController.getQuizPerformance,
);

router.get(
  "/teacher/course-completion-funnel",
  requirePermission("teacher.dashboard.view"),
  validateRequest(DashboardValidation.teacherFilterQueryZodSchema),
  DashboardController.getCourseCompletionFunnel,
);

router.get(
  "/teacher/at-risk-students",
  requirePermission("teacher.dashboard.view"),
  validateRequest(DashboardValidation.teacherFilterQueryZodSchema),
  DashboardController.getAtRiskStudents,
);

// ==========================================
// 2. INSTITUTE ADMIN DASHBOARD (scope INSTITUTE)
// ==========================================

router.get(
  "/admin",
  requirePermission("admin.dashboard.view"),
  DashboardController.getAdminDashboard,
);

router.get(
  "/admin/enrollment-trend",
  requirePermission("admin.dashboard.view"),
  validateRequest(DashboardValidation.adminFilterQueryZodSchema),
  DashboardController.getEnrollmentTrend,
);

router.get(
  "/admin/attendance-rate",
  requirePermission("admin.dashboard.view"),
  validateRequest(DashboardValidation.adminFilterQueryZodSchema),
  DashboardController.getAttendanceRate,
);

router.get(
  "/admin/result-pass-rate",
  requirePermission("admin.dashboard.view"),
  validateRequest(DashboardValidation.adminFilterQueryZodSchema),
  DashboardController.getResultPassRate,
);

router.get(
  "/admin/lms-engagement",
  requirePermission("admin.dashboard.view"),
  validateRequest(DashboardValidation.adminFilterQueryZodSchema),
  DashboardController.getLmsEngagement,
);

router.get(
  "/admin/teacher-workload",
  requirePermission("admin.dashboard.view"),
  DashboardController.getTeacherWorkload,
);

router.get(
  "/admin/support-stats",
  requirePermission("admin.dashboard.view"),
  DashboardController.getSupportStats,
);

// ==========================================
// 3. GUARDIAN DASHBOARD (scope via StudentGuardian)
// ==========================================

router.get(
  "/guardian",
  requirePermission("guardian.dashboard.view"),
  validateRequest(DashboardValidation.guardianFilterQueryZodSchema),
  DashboardController.getGuardianDashboard,
);

router.get(
  "/guardian/children",
  requirePermission("guardian.dashboard.view"),
  DashboardController.listChildren,
);

router.get(
  "/guardian/children/:childId",
  requirePermission("guardian.dashboard.view"),
  validateRequest(DashboardValidation.childIdParamZodSchema),
  DashboardController.getGuardianDashboard,
);

router.get(
  "/guardian/children/:childId/attendance",
  requirePermission("guardian.dashboard.view"),
  validateRequest(DashboardValidation.childIdParamZodSchema),
  DashboardController.getChildAttendance,
);

router.get(
  "/guardian/children/:childId/results",
  requirePermission("guardian.dashboard.view"),
  validateRequest(DashboardValidation.childIdParamZodSchema),
  DashboardController.getChildResults,
);

router.get(
  "/guardian/children/:childId/notices",
  requirePermission("guardian.dashboard.view"),
  validateRequest(DashboardValidation.childIdParamZodSchema),
  DashboardController.getChildNotices,
);

export const DashboardRoutes = router;
export default DashboardRoutes;
