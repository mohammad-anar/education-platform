import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { GradingController } from "./grading.controller.js";
import { GradingValidation } from "./grading.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("assessment.grading.create"),
  validateRequest(GradingValidation.createZodSchema),
  GradingController.create,
);

router.get(
  "/",
  requirePermission("assessment.grading.read"),
  GradingController.getAll,
);

router.get(
  "/:id",
  requirePermission("assessment.grading.read"),
  GradingController.getById,
);

router.patch(
  "/:id",
  requirePermission("assessment.grading.update"),
  validateRequest(GradingValidation.updateZodSchema),
  GradingController.update,
);

router.delete(
  "/:id",
  requirePermission("assessment.grading.delete"),
  GradingController.deleteById,
);

export const GradingRoutes = router;
export default GradingRoutes;
