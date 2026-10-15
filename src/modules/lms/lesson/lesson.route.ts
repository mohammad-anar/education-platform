import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { LessonController } from "./lesson.controller.js";
import { LessonValidation } from "./lesson.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.lesson.create"),
  validateRequest(LessonValidation.createZodSchema),
  LessonController.create,
);

router.get(
  "/",
  requirePermission("lms.lesson.read"),
  LessonController.getAll,
);

router.get(
  "/:id",
  requirePermission("lms.lesson.read"),
  LessonController.getById,
);

router.patch(
  "/:id",
  requirePermission("lms.lesson.update"),
  validateRequest(LessonValidation.updateZodSchema),
  LessonController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.lesson.delete"),
  LessonController.deleteById,
);

export const LessonRoutes = router;
export default LessonRoutes;
