import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { SessionController } from "./session.controller.js";
import { SessionValidation } from "./session.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(SessionValidation.createZodSchema),
  SessionController.create,
);

router.get(
  "/",
  auth(),
  SessionController.getAll,
);

router.get(
  "/:id",
  auth(),
  SessionController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(SessionValidation.updateZodSchema),
  SessionController.update,
);

router.delete(
  "/:id",
  auth(),
  SessionController.deleteById,
);

export const SessionRoutes = router;
export default SessionRoutes;
