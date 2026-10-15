import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { CalendarController } from "./calendar.controller.js";
import { CalendarValidation } from "./calendar.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("attendance.calendar.create"),
  validateRequest(CalendarValidation.createZodSchema),
  CalendarController.create,
);

router.get(
  "/",
  requirePermission("attendance.calendar.read"),
  CalendarController.getAll,
);

router.post(
  "/:id/generate-sessions",
  requirePermission("attendance.calendar.generateSessions"),
  CalendarController.generateSessions,
);

router.get(
  "/:id",
  requirePermission("attendance.calendar.read"),
  CalendarController.getById,
);

router.patch(
  "/:id",
  requirePermission("attendance.calendar.update"),
  validateRequest(CalendarValidation.updateZodSchema),
  CalendarController.update,
);

router.delete(
  "/:id",
  requirePermission("attendance.calendar.delete"),
  CalendarController.deleteById,
);

export const CalendarRoutes = router;
export default CalendarRoutes;
