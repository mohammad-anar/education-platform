import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { PolicyController } from "./policy.controller.js";
import { PolicyValidation } from "./policy.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("attendance.policy.create"),
  validateRequest(PolicyValidation.createZodSchema),
  PolicyController.create,
);

router.get(
  "/",
  requirePermission("attendance.policy.read"),
  PolicyController.getAll,
);

router.get(
  "/:id",
  requirePermission("attendance.policy.read"),
  PolicyController.getById,
);

router.patch(
  "/:id",
  requirePermission("attendance.policy.update"),
  validateRequest(PolicyValidation.updateZodSchema),
  PolicyController.update,
);

router.delete(
  "/:id",
  requirePermission("attendance.policy.delete"),
  PolicyController.deleteById,
);

export const PolicyRoutes = router;
export default PolicyRoutes;
