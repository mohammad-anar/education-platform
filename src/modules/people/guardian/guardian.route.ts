import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { GuardianController } from "./guardian.controller.js";
import { GuardianValidation } from "./guardian.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("people.guardian.create"),
  validateRequest(GuardianValidation.createZodSchema),
  GuardianController.create,
);

router.get(
  "/",
  requirePermission("people.guardian.read"),
  GuardianController.getAll,
);

router.get(
  "/:id",
  requirePermission("people.guardian.read"),
  GuardianController.getById,
);

router.patch(
  "/:id",
  requirePermission("people.guardian.update"),
  validateRequest(GuardianValidation.updateZodSchema),
  GuardianController.update,
);

router.delete(
  "/:id",
  requirePermission("people.guardian.delete"),
  GuardianController.deleteById,
);

export const GuardianRoutes = router;
export default GuardianRoutes;
