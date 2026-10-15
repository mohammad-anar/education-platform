import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { LessonNoteController } from "./lessonNote.controller.js";
import { LessonNoteValidation } from "./lessonNote.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.lessonNote.create"),
  validateRequest(LessonNoteValidation.createZodSchema),
  LessonNoteController.create,
);

router.get(
  "/",
  requirePermission("lms.lessonNote.read"),
  LessonNoteController.getAll,
);

router.get(
  "/:id",
  requirePermission("lms.lessonNote.read"),
  LessonNoteController.getById,
);

router.patch(
  "/:id",
  requirePermission("lms.lessonNote.update"),
  validateRequest(LessonNoteValidation.updateZodSchema),
  LessonNoteController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.lessonNote.delete"),
  LessonNoteController.deleteById,
);

export const LessonNoteRoutes = router;
export default LessonNoteRoutes;
