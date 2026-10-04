import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { LessonVideoController } from "./lessonVideo.controller.js";
import { LessonVideoValidation } from "./lessonVideo.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(LessonVideoValidation.createZodSchema),
  LessonVideoController.create,
);

router.get(
  "/",
  auth(),
  LessonVideoController.getAll,
);

router.get(
  "/:id",
  auth(),
  LessonVideoController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(LessonVideoValidation.updateZodSchema),
  LessonVideoController.update,
);

router.delete(
  "/:id",
  auth(),
  LessonVideoController.deleteById,
);

export const LessonVideoRoutes = router;
export default LessonVideoRoutes;
