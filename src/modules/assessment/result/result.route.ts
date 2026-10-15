import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { ResultController } from "./result.controller.js";
import { ResultValidation } from "./result.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("assessment.result.create"),
  validateRequest(ResultValidation.createZodSchema),
  ResultController.create,
);

router.get(
  "/",
  requirePermission("assessment.result.read"),
  ResultController.getAll,
);

router.get(
  "/:id",
  requirePermission("assessment.result.read"),
  ResultController.getById,
);

router.patch(
  "/:id",
  requirePermission("assessment.result.update"),
  validateRequest(ResultValidation.updateZodSchema),
  ResultController.update,
);

router.delete(
  "/:id",
  requirePermission("assessment.result.delete"),
  ResultController.deleteById,
);

router.post(
  "/:id/publish",
  requirePermission("assessment.result.publish"),
  ResultController.publishResult,
);

router.post(
  "/:id/override",
  requirePermission("assessment.result.override"),
  ResultController.overrideResult,
);

export const ResultRoutes = router;
export default ResultRoutes;
