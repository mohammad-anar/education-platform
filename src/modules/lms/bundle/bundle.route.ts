import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { BundleController } from "./bundle.controller.js";
import { BundleValidation } from "./bundle.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.bundle.create"),
  validateRequest(BundleValidation.createZodSchema),
  BundleController.create,
);

router.get(
  "/",
  requirePermission("lms.bundle.read"),
  BundleController.getAll,
);

router.get(
  "/:id",
  requirePermission("lms.bundle.read"),
  BundleController.getById,
);

router.patch(
  "/:id",
  requirePermission("lms.bundle.update"),
  validateRequest(BundleValidation.updateZodSchema),
  BundleController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.bundle.delete"),
  BundleController.deleteById,
);

export const BundleRoutes = router;
export default BundleRoutes;
