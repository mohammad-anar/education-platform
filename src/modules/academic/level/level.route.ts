import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { LevelController } from "./level.controller.js";
import { LevelValidation } from "./level.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("academic.level.create"),
  validateRequest(LevelValidation.createZodSchema),
  LevelController.create,
);

router.get(
  "/",
  requirePermission("academic.level.read"),
  LevelController.getAll,
);

router.get(
  "/:id",
  requirePermission("academic.level.read"),
  LevelController.getById,
);

router.patch(
  "/:id",
  requirePermission("academic.level.update"),
  validateRequest(LevelValidation.updateZodSchema),
  LevelController.update,
);

router.delete(
  "/:id",
  requirePermission("academic.level.delete"),
  LevelController.deleteById,
);

export const LevelRoutes = router;
export default LevelRoutes;
