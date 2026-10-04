import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { AssessmentController } from "./assessment.controller.js";
import { AssessmentValidation } from "./assessment.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(AssessmentValidation.createZodSchema),
  AssessmentController.create,
);

router.get(
  "/",
  auth(),
  AssessmentController.getAll,
);

router.get(
  "/:id",
  auth(),
  AssessmentController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(AssessmentValidation.updateZodSchema),
  AssessmentController.update,
);

router.delete(
  "/:id",
  auth(),
  AssessmentController.deleteById,
);

export const AssessmentRoutes = router;
export default AssessmentRoutes;
