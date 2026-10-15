import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { ExamController } from "./exam.controller.js";
import { ExamValidation } from "./exam.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("assessment.exam.create"),
  validateRequest(ExamValidation.createZodSchema),
  ExamController.create,
);

router.get(
  "/",
  requirePermission("assessment.exam.read"),
  ExamController.getAll,
);

router.get(
  "/:id",
  requirePermission("assessment.exam.read"),
  ExamController.getById,
);

router.patch(
  "/:id",
  requirePermission("assessment.exam.update"),
  validateRequest(ExamValidation.updateZodSchema),
  ExamController.update,
);

router.delete(
  "/:id",
  requirePermission("assessment.exam.delete"),
  ExamController.deleteById,
);

router.patch(
  "/marks/:id",
  requirePermission("assessment.exam.updateMark"),
  ExamController.updateExamMark,
);

export const ExamRoutes = router;
export default ExamRoutes;
