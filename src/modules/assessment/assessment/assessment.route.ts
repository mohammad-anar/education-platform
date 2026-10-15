import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { AssessmentController } from "./assessment.controller.js";
import { AssessmentValidation } from "./assessment.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("assessment.assessment.create"),
  validateRequest(AssessmentValidation.createZodSchema),
  AssessmentController.create,
);

router.get(
  "/",
  requirePermission("assessment.assessment.read"),
  AssessmentController.getAll,
);

router.get(
  "/:id",
  requirePermission("assessment.assessment.read"),
  AssessmentController.getById,
);

router.post(
  "/:id/submit-quiz",
  requirePermission("assessment.assessment.read"),
  AssessmentController.submitQuiz,
);

router.post(
  "/:id/submit-assignment",
  requirePermission("assessment.assessment.read"),
  AssessmentController.submitAssignment,
);

router.patch(
  "/:id",
  requirePermission("assessment.assessment.update"),
  validateRequest(AssessmentValidation.updateZodSchema),
  AssessmentController.update,
);

router.delete(
  "/:id",
  requirePermission("assessment.assessment.delete"),
  AssessmentController.deleteById,
);

export const AssessmentRoutes = router;
export default AssessmentRoutes;
