import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { RoutineController } from "./routine.controller.js";
import { RoutineValidation } from "./routine.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("attendance.routine.create"),
  validateRequest(RoutineValidation.createZodSchema),
  RoutineController.create,
);

router.get(
  "/",
  requirePermission("attendance.routine.read"),
  RoutineController.getAll,
);

router.get(
  "/:id",
  requirePermission("attendance.routine.read"),
  RoutineController.getById,
);

router.patch(
  "/:id",
  requirePermission("attendance.routine.update"),
  validateRequest(RoutineValidation.updateZodSchema),
  RoutineController.update,
);

router.delete(
  "/:id",
  requirePermission("attendance.routine.delete"),
  RoutineController.deleteById,
);

export const RoutineRoutes = router;
export default RoutineRoutes;
