import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { LessonController } from "./lesson.controller.js";
import { LessonValidation } from "./lesson.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(LessonValidation.createZodSchema),
  LessonController.create,
);

router.get(
  "/",
  auth(),
  LessonController.getAll,
);

router.get(
  "/:id",
  auth(),
  LessonController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(LessonValidation.updateZodSchema),
  LessonController.update,
);

router.delete(
  "/:id",
  auth(),
  LessonController.deleteById,
);

export const LessonRoutes = router;
export default LessonRoutes;
