import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { GradingController } from "./grading.controller.js";
import { GradingValidation } from "./grading.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(GradingValidation.createZodSchema),
  GradingController.create,
);

router.get(
  "/",
  auth(),
  GradingController.getAll,
);

router.get(
  "/:id",
  auth(),
  GradingController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(GradingValidation.updateZodSchema),
  GradingController.update,
);

router.delete(
  "/:id",
  auth(),
  GradingController.deleteById,
);

export const GradingRoutes = router;
export default GradingRoutes;
