import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { SectionController } from "./section.controller.js";
import { SectionValidation } from "./section.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("academic.section.create"),
  validateRequest(SectionValidation.createZodSchema),
  SectionController.create,
);

router.get(
  "/",
  requirePermission("academic.section.read"),
  SectionController.getAll,
);

router.get(
  "/:id",
  requirePermission("academic.section.read"),
  SectionController.getById,
);

router.patch(
  "/:id",
  requirePermission("academic.section.update"),
  validateRequest(SectionValidation.updateZodSchema),
  SectionController.update,
);

router.delete(
  "/:id",
  requirePermission("academic.section.delete"),
  SectionController.deleteById,
);

export const SectionRoutes = router;
export default SectionRoutes;
