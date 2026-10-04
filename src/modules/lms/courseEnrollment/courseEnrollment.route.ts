import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { CourseEnrollmentController } from "./courseEnrollment.controller.js";
import { CourseEnrollmentValidation } from "./courseEnrollment.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(CourseEnrollmentValidation.createZodSchema),
  CourseEnrollmentController.create,
);

router.get(
  "/",
  auth(),
  CourseEnrollmentController.getAll,
);

router.get(
  "/:id",
  auth(),
  CourseEnrollmentController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(CourseEnrollmentValidation.updateZodSchema),
  CourseEnrollmentController.update,
);

router.delete(
  "/:id",
  auth(),
  CourseEnrollmentController.deleteById,
);

export const CourseEnrollmentRoutes = router;
export default CourseEnrollmentRoutes;
