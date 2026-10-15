import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { UserController } from "./user.controller.js";
import { UserValidation } from "./user.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("identity.user.create"),
  validateRequest(UserValidation.createZodSchema),
  UserController.create,
);

router.get(
  "/",
  requirePermission("identity.user.read"),
  UserController.getAll,
);

router.get(
  "/:id",
  requirePermission("identity.user.read"),
  UserController.getById,
);

router.patch(
  "/:id",
  requirePermission("identity.user.update"),
  validateRequest(UserValidation.updateZodSchema),
  UserController.update,
);

router.delete(
  "/:id",
  requirePermission("identity.user.delete"),
  UserController.deleteById,
);

router.post(
  "/:id/roles",
  requirePermission("identity.user.assignRole"),
  validateRequest(UserValidation.assignRoleZodSchema),
  UserController.assignRole,
);

router.delete(
  "/:id/roles/:roleId",
  requirePermission("identity.user.assignRole"),
  UserController.revokeRole,
);

router.post(
  "/:id/permission-overrides",
  requirePermission("identity.user.overridePermission"),
  validateRequest(UserValidation.grantOverrideZodSchema),
  UserController.grantUserPermission,
);

router.get(
  "/:id/permission-overrides",
  requirePermission("identity.user.read"),
  UserController.listUserPermissionOverrides,
);

router.delete(
  "/:id/permission-overrides/:overrideId",
  requirePermission("identity.user.overridePermission"),
  UserController.revokeUserPermissionOverride,
);

router.get(
  "/:id/effective-permissions",
  requirePermission("identity.user.read"),
  UserController.getUserEffectivePermissions,
);

export const UserRoutes = router;
export default UserRoutes;
