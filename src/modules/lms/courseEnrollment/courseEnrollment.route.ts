import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { CourseEnrollmentController } from "./courseEnrollment.controller.js";
import { CourseEnrollmentValidation } from "./courseEnrollment.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.courseEnrollment.create"),
  validateRequest(CourseEnrollmentValidation.createZodSchema),
  CourseEnrollmentController.create,
);

router.get(
  "/",
  requirePermission("lms.courseEnrollment.read"),
  CourseEnrollmentController.getAll,
);

router.get(
  "/:id",
  requirePermission("lms.courseEnrollment.read"),
  CourseEnrollmentController.getById,
);

router.patch(
  "/:id",
  requirePermission("lms.courseEnrollment.update"),
  validateRequest(CourseEnrollmentValidation.updateZodSchema),
  CourseEnrollmentController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.courseEnrollment.delete"),
  CourseEnrollmentController.deleteById,
);

router.post(
  "/restrictions",
  requirePermission("lms.courseEnrollment.restrict"),
  CourseEnrollmentController.createRestriction,
);

router.post(
  "/restrictions/:restrictionId/revoke",
  requirePermission("lms.courseEnrollment.revokeRestriction"),
  CourseEnrollmentController.revokeRestriction,
);

export const CourseEnrollmentRoutes = router;
export default CourseEnrollmentRoutes;
