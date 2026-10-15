import express from "express";
import validateRequest from "../../middleware/validate.middleware.js";
import { requirePermission } from "../../middleware/auth.middleware.js";
import { StudentPortalController } from "./student-portal.controller.js";
import { StudentPortalValidation } from "./student-portal.validation.js";

const router = express.Router();

router.get(
  "/",
  requirePermission("student.portal.view"),
  StudentPortalController.getDashboard,
);

router.get(
  "/today-summary",
  requirePermission("student.portal.view"),
  StudentPortalController.getTodaySummary,
);

router.get(
  "/attendance/history",
  requirePermission("student.portal.view"),
  validateRequest(StudentPortalValidation.getAttendanceHistoryQueryZodSchema),
  StudentPortalController.getAttendanceHistory,
);

router.get(
  "/attendance/calendar",
  requirePermission("student.portal.view"),
  validateRequest(StudentPortalValidation.getAttendanceCalendarQueryZodSchema),
  StudentPortalController.getAttendanceCalendar,
);

router.get(
  "/attendance/summary",
  requirePermission("student.portal.view"),
  validateRequest(StudentPortalValidation.getSubjectAttendanceSummaryQueryZodSchema),
  StudentPortalController.getSubjectAttendanceSummary,
);

router.get(
  "/subject-progress",
  requirePermission("student.portal.view"),
  StudentPortalController.getSubjectProgress,
);

router.get(
  "/overdue-items",
  requirePermission("student.portal.view"),
  StudentPortalController.getOverdueItems,
);

router.get(
  "/upcoming-items",
  requirePermission("student.portal.view"),
  validateRequest(StudentPortalValidation.getUpcomingItemsQueryZodSchema),
  StudentPortalController.getUpcomingItems,
);

router.get(
  "/continue-learning",
  requirePermission("student.portal.view"),
  StudentPortalController.getContinueLearning,
);

router.get(
  "/performance-trend",
  requirePermission("student.portal.view"),
  StudentPortalController.getPerformanceTrend,
);

router.get(
  "/study-activity",
  requirePermission("student.portal.view"),
  validateRequest(StudentPortalValidation.getStudyActivityQueryZodSchema),
  StudentPortalController.getStudyActivity,
);

export const StudentPortalRoutes = router;
export default StudentPortalRoutes;
