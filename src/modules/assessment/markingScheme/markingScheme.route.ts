import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { MarkingSchemeController } from "./markingScheme.controller.js";
import { MarkingSchemeValidation } from "./markingScheme.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("assessment.markingScheme.create"),
  validateRequest(MarkingSchemeValidation.createZodSchema),
  MarkingSchemeController.create,
);

router.get(
  "/",
  requirePermission("assessment.markingScheme.read"),
  MarkingSchemeController.getAll,
);

router.get(
  "/:id",
  requirePermission("assessment.markingScheme.read"),
  MarkingSchemeController.getById,
);

router.patch(
  "/:id",
  requirePermission("assessment.markingScheme.update"),
  validateRequest(MarkingSchemeValidation.updateZodSchema),
  MarkingSchemeController.update,
);

router.delete(
  "/:id",
  requirePermission("assessment.markingScheme.delete"),
  MarkingSchemeController.deleteById,
);

export const MarkingSchemeRoutes = router;
export default MarkingSchemeRoutes;
