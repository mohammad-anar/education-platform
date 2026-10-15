import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { SubscriptionController } from "./subscription.controller.js";
import { SubscriptionValidation } from "./subscription.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("saas.subscription.create"),
  validateRequest(SubscriptionValidation.createZodSchema),
  SubscriptionController.create,
);

router.get(
  "/",
  requirePermission("saas.subscription.read"),
  SubscriptionController.getAll,
);

router.get(
  "/:id",
  requirePermission("saas.subscription.read"),
  SubscriptionController.getById,
);

router.patch(
  "/:id",
  requirePermission("saas.subscription.update"),
  validateRequest(SubscriptionValidation.updateZodSchema),
  SubscriptionController.update,
);

router.delete(
  "/:id",
  requirePermission("saas.subscription.delete"),
  SubscriptionController.deleteById,
);

export const SubscriptionRoutes = router;
export default SubscriptionRoutes;
