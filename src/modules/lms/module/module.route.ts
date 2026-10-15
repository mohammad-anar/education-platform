import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { ModuleController } from "./module.controller.js";
import { ModuleValidation } from "./module.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.module.create"),
  validateRequest(ModuleValidation.createZodSchema),
  ModuleController.create,
);

router.get(
  "/",
  requirePermission("lms.module.read"),
  ModuleController.getAll,
);

router.get(
  "/:id",
  requirePermission("lms.module.read"),
  ModuleController.getById,
);

router.patch(
  "/:id",
  requirePermission("lms.module.update"),
  validateRequest(ModuleValidation.updateZodSchema),
  ModuleController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.module.delete"),
  ModuleController.deleteById,
);

export const ModuleRoutes = router;
export default ModuleRoutes;
