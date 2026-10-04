import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { BundleController } from "./bundle.controller.js";
import { BundleValidation } from "./bundle.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(BundleValidation.createZodSchema),
  BundleController.create,
);

router.get(
  "/",
  auth(),
  BundleController.getAll,
);

router.get(
  "/:id",
  auth(),
  BundleController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(BundleValidation.updateZodSchema),
  BundleController.update,
);

router.delete(
  "/:id",
  auth(),
  BundleController.deleteById,
);

export const BundleRoutes = router;
export default BundleRoutes;
