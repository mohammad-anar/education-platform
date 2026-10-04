import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { ExamController } from "./exam.controller.js";
import { ExamValidation } from "./exam.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(ExamValidation.createZodSchema),
  ExamController.create,
);

router.get(
  "/",
  auth(),
  ExamController.getAll,
);

router.get(
  "/:id",
  auth(),
  ExamController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(ExamValidation.updateZodSchema),
  ExamController.update,
);

router.delete(
  "/:id",
  auth(),
  ExamController.deleteById,
);

export const ExamRoutes = router;
export default ExamRoutes;
