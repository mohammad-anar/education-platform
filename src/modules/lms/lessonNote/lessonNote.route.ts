import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { LessonNoteController } from "./lessonNote.controller.js";
import { LessonNoteValidation } from "./lessonNote.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(LessonNoteValidation.createZodSchema),
  LessonNoteController.create,
);

router.get(
  "/",
  auth(),
  LessonNoteController.getAll,
);

router.get(
  "/:id",
  auth(),
  LessonNoteController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(LessonNoteValidation.updateZodSchema),
  LessonNoteController.update,
);

router.delete(
  "/:id",
  auth(),
  LessonNoteController.deleteById,
);

export const LessonNoteRoutes = router;
export default LessonNoteRoutes;
