import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { ModuleController } from "./module.controller.js";
import { ModuleValidation } from "./module.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(ModuleValidation.createZodSchema),
  ModuleController.create,
);

router.get(
  "/",
  auth(),
  ModuleController.getAll,
);

router.get(
  "/:id",
  auth(),
  ModuleController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(ModuleValidation.updateZodSchema),
  ModuleController.update,
);

router.delete(
  "/:id",
  auth(),
  ModuleController.deleteById,
);

export const ModuleRoutes = router;
export default ModuleRoutes;
