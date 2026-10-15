import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { PermissionController } from "./permission.controller.js";
import { PermissionValidation } from "./permission.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("identity.permission.create"),
  validateRequest(PermissionValidation.createZodSchema),
  PermissionController.create,
);

router.get(
  "/",
  requirePermission("identity.permission.read"),
  PermissionController.getAll,
);

router.get(
  "/catalog",
  requirePermission("identity.permission.read"),
  PermissionController.listCatalog,
);

router.get(
  "/:id",
  requirePermission("identity.permission.read"),
  PermissionController.getById,
);

router.patch(
  "/:id",
  requirePermission("identity.permission.update"),
  validateRequest(PermissionValidation.updateZodSchema),
  PermissionController.update,
);

router.delete(
  "/:id",
  requirePermission("identity.permission.delete"),
  PermissionController.deleteById,
);

export const PermissionRoutes = router;
export default PermissionRoutes;
