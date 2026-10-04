import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { EnrollmentController } from "./enrollment.controller.js";
import { EnrollmentValidation } from "./enrollment.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(EnrollmentValidation.createZodSchema),
  EnrollmentController.create,
);

router.get(
  "/",
  auth(),
  EnrollmentController.getAll,
);

router.get(
  "/:id",
  auth(),
  EnrollmentController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(EnrollmentValidation.updateZodSchema),
  EnrollmentController.update,
);

router.delete(
  "/:id",
  auth(),
  EnrollmentController.deleteById,
);

export const EnrollmentRoutes = router;
export default EnrollmentRoutes;
