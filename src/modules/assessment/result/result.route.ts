import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { ResultController } from "./result.controller.js";
import { ResultValidation } from "./result.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(ResultValidation.createZodSchema),
  ResultController.create,
);

router.get(
  "/",
  auth(),
  ResultController.getAll,
);

router.get(
  "/:id",
  auth(),
  ResultController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(ResultValidation.updateZodSchema),
  ResultController.update,
);

router.delete(
  "/:id",
  auth(),
  ResultController.deleteById,
);

export const ResultRoutes = router;
export default ResultRoutes;
