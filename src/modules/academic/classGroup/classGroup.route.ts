import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { ClassGroupController } from "./classGroup.controller.js";
import { ClassGroupValidation } from "./classGroup.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("academic.classGroup.create"),
  validateRequest(ClassGroupValidation.createZodSchema),
  ClassGroupController.create,
);

router.get(
  "/",
  requirePermission("academic.classGroup.read"),
  ClassGroupController.getAll,
);

router.get(
  "/:id",
  requirePermission("academic.classGroup.read"),
  ClassGroupController.getById,
);

router.patch(
  "/:id",
  requirePermission("academic.classGroup.update"),
  validateRequest(ClassGroupValidation.updateZodSchema),
  ClassGroupController.update,
);

router.delete(
  "/:id",
  requirePermission("academic.classGroup.delete"),
  ClassGroupController.deleteById,
);

export const ClassGroupRoutes = router;
export default ClassGroupRoutes;
