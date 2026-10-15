import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { NotificationController } from "./notification.controller.js";
import { NotificationValidation } from "./notification.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("platform.notification.create"),
  validateRequest(NotificationValidation.createZodSchema),
  NotificationController.create,
);

router.get(
  "/",
  requirePermission("platform.notification.read"),
  NotificationController.getAll,
);

router.get(
  "/:id",
  requirePermission("platform.notification.read"),
  NotificationController.getById,
);

router.patch(
  "/:id",
  requirePermission("platform.notification.update"),
  validateRequest(NotificationValidation.updateZodSchema),
  NotificationController.update,
);

router.delete(
  "/:id",
  requirePermission("platform.notification.delete"),
  NotificationController.deleteById,
);

export const NotificationRoutes = router;
export default NotificationRoutes;
