import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { CourseController } from "./course.controller.js";
import { CourseValidation } from "./course.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.course.create"),
  validateRequest(CourseValidation.createZodSchema),
  CourseController.create,
);

router.get(
  "/",
  requirePermission("lms.course.read"),
  CourseController.getAll,
);

// @deprecated Superseded by GET /api/v1/dashboard/teacher/course-completion-funnel or admin LMS analytics
router.get(
  "/:id/stats",
  requirePermission("lms.course.stats"),
  CourseController.getStats,
);

router.get(
  "/:id",
  requirePermission("lms.course.read"),
  CourseController.getById,
);

router.patch(
  "/:id",
  requirePermission("lms.course.update"),
  validateRequest(CourseValidation.updateZodSchema),
  CourseController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.course.delete"),
  CourseController.deleteById,
);

export const CourseRoutes = router;
export default CourseRoutes;
