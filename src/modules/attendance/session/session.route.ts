import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { SessionController } from "./session.controller.js";
import { SessionValidation } from "./session.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("attendance.session.create"),
  validateRequest(SessionValidation.createZodSchema),
  SessionController.create,
);

router.get(
  "/",
  requirePermission("attendance.session.read"),
  SessionController.getAll,
);

router.get(
  "/:id",
  requirePermission("attendance.session.read"),
  SessionController.getById,
);

router.post(
  "/:id/mark",
  requirePermission("attendance.session.update"),
  SessionController.markAttendance,
);

router.patch(
  "/:id",
  requirePermission("attendance.session.update"),
  validateRequest(SessionValidation.updateZodSchema),
  SessionController.update,
);

router.delete(
  "/:id",
  requirePermission("attendance.session.delete"),
  SessionController.deleteById,
);

export const SessionRoutes = router;
export default SessionRoutes;
