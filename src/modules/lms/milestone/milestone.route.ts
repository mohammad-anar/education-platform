import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { MilestoneController } from "./milestone.controller.js";
import { MilestoneValidation } from "./milestone.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.milestone.create"),
  validateRequest(MilestoneValidation.createZodSchema),
  MilestoneController.create,
);

router.get(
  "/",
  requirePermission("lms.milestone.read"),
  MilestoneController.getAll,
);

router.get(
  "/:id",
  requirePermission("lms.milestone.read"),
  MilestoneController.getById,
);

router.patch(
  "/:id",
  requirePermission("lms.milestone.update"),
  validateRequest(MilestoneValidation.updateZodSchema),
  MilestoneController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.milestone.delete"),
  MilestoneController.deleteById,
);

export const MilestoneRoutes = router;
export default MilestoneRoutes;
