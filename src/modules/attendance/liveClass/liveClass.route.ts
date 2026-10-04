import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { LiveClassController } from "./liveClass.controller.js";
import { LiveClassValidation } from "./liveClass.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(LiveClassValidation.createZodSchema),
  LiveClassController.create,
);

router.get(
  "/",
  auth(),
  LiveClassController.getAll,
);

router.get(
  "/:id",
  auth(),
  LiveClassController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(LiveClassValidation.updateZodSchema),
  LiveClassController.update,
);

router.delete(
  "/:id",
  auth(),
  LiveClassController.deleteById,
);

export const LiveClassRoutes = router;
export default LiveClassRoutes;
