import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { NotificationController } from "./notification.controller.js";
import { NotificationValidation } from "./notification.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(NotificationValidation.createZodSchema),
  NotificationController.create,
);

router.get(
  "/",
  auth(),
  NotificationController.getAll,
);

router.get(
  "/:id",
  auth(),
  NotificationController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(NotificationValidation.updateZodSchema),
  NotificationController.update,
);

router.delete(
  "/:id",
  auth(),
  NotificationController.deleteById,
);

export const NotificationRoutes = router;
export default NotificationRoutes;
