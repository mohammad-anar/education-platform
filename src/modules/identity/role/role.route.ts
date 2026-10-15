import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { RoleController } from "./role.controller.js";
import { RoleValidation } from "./role.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("identity.role.create"),
  validateRequest(RoleValidation.createZodSchema),
  RoleController.create,
);

router.get(
  "/",
  requirePermission("identity.role.read"),
  RoleController.getAll,
);

router.get(
  "/:id",
  requirePermission("identity.role.read"),
  RoleController.getById,
);

router.patch(
  "/:id",
  requirePermission("identity.role.update"),
  validateRequest(RoleValidation.updateZodSchema),
  RoleController.update,
);

router.delete(
  "/:id",
  requirePermission("identity.role.delete"),
  validateRequest(RoleValidation.deleteRoleZodSchema),
  RoleController.deleteById,
);

router.get(
  "/:id/matrix",
  requirePermission("identity.role.read"),
  RoleController.getRoleMatrix,
);

router.put(
  "/:id/matrix",
  requirePermission("identity.role.assignPermissions"),
  validateRequest(RoleValidation.setRoleMatrixZodSchema),
  RoleController.setRoleMatrix,
);

router.get(
  "/:id/impact",
  requirePermission("identity.role.read"),
  RoleController.previewRoleImpact,
);

router.put(
  "/:id/permissions",
  requirePermission("identity.role.assignPermissions"),
  RoleController.updatePermissions,
);

export const RoleRoutes = router;
export default RoleRoutes;
