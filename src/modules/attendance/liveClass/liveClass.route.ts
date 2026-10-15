import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { LiveClassController } from "./liveClass.controller.js";
import { LiveClassValidation } from "./liveClass.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("attendance.liveClass.create"),
  validateRequest(LiveClassValidation.createZodSchema),
  LiveClassController.create,
);

router.get(
  "/",
  requirePermission("attendance.liveClass.read"),
  LiveClassController.getAll,
);

router.get(
  "/:id",
  requirePermission("attendance.liveClass.read"),
  LiveClassController.getById,
);

router.patch(
  "/:id",
  requirePermission("attendance.liveClass.update"),
  validateRequest(LiveClassValidation.updateZodSchema),
  LiveClassController.update,
);

router.delete(
  "/:id",
  requirePermission("attendance.liveClass.delete"),
  LiveClassController.deleteById,
);

export const LiveClassRoutes = router;
export default LiveClassRoutes;
