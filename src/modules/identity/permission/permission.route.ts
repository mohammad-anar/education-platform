import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { PermissionController } from "./permission.controller.js";
import { PermissionValidation } from "./permission.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(PermissionValidation.createZodSchema),
  PermissionController.create,
);

router.get(
  "/",
  auth(),
  PermissionController.getAll,
);

router.get(
  "/:id",
  auth(),
  PermissionController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(PermissionValidation.updateZodSchema),
  PermissionController.update,
);

router.delete(
  "/:id",
  auth(),
  PermissionController.deleteById,
);

export const PermissionRoutes = router;
export default PermissionRoutes;
