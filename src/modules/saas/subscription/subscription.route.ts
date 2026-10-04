import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { SubscriptionController } from "./subscription.controller.js";
import { SubscriptionValidation } from "./subscription.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(SubscriptionValidation.createZodSchema),
  SubscriptionController.create,
);

router.get(
  "/",
  auth(),
  SubscriptionController.getAll,
);

router.get(
  "/:id",
  auth(),
  SubscriptionController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(SubscriptionValidation.updateZodSchema),
  SubscriptionController.update,
);

router.delete(
  "/:id",
  auth(),
  SubscriptionController.deleteById,
);

export const SubscriptionRoutes = router;
export default SubscriptionRoutes;
