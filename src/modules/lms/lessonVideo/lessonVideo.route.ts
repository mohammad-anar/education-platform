import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { LessonVideoController } from "./lessonVideo.controller.js";
import { LessonVideoValidation } from "./lessonVideo.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.lessonVideo.create"),
  validateRequest(LessonVideoValidation.createZodSchema),
  LessonVideoController.create,
);

router.get(
  "/",
  requirePermission("lms.lessonVideo.read"),
  LessonVideoController.getAll,
);

router.get(
  "/:id",
  requirePermission("lms.lessonVideo.read"),
  LessonVideoController.getById,
);

router.post(
  "/:id/heartbeat",
  requirePermission("lms.lessonVideo.read"),
  LessonVideoController.recordHeartbeat,
);

router.patch(
  "/:id",
  requirePermission("lms.lessonVideo.update"),
  validateRequest(LessonVideoValidation.updateZodSchema),
  LessonVideoController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.lessonVideo.delete"),
  LessonVideoController.deleteById,
);

export const LessonVideoRoutes = router;
export default LessonVideoRoutes;
