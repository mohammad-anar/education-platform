import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { EnrollmentController } from "./enrollment.controller.js";
import { EnrollmentValidation } from "./enrollment.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("academic.enrollment.create"),
  validateRequest(EnrollmentValidation.createZodSchema),
  EnrollmentController.create,
);

router.get(
  "/",
  requirePermission("academic.enrollment.read"),
  EnrollmentController.getAll,
);

router.get(
  "/:id",
  requirePermission("academic.enrollment.read"),
  EnrollmentController.getById,
);

router.patch(
  "/:id",
  requirePermission("academic.enrollment.update"),
  validateRequest(EnrollmentValidation.updateZodSchema),
  EnrollmentController.update,
);

router.delete(
  "/:id",
  requirePermission("academic.enrollment.delete"),
  EnrollmentController.deleteById,
);

export const EnrollmentRoutes = router;
export default EnrollmentRoutes;
