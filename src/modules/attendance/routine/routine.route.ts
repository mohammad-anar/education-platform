import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { RoutineController } from "./routine.controller.js";
import { RoutineValidation } from "./routine.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(RoutineValidation.createZodSchema),
  RoutineController.create,
);

router.get(
  "/",
  auth(),
  RoutineController.getAll,
);

router.get(
  "/:id",
  auth(),
  RoutineController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(RoutineValidation.updateZodSchema),
  RoutineController.update,
);

router.delete(
  "/:id",
  auth(),
  RoutineController.deleteById,
);

export const RoutineRoutes = router;
export default RoutineRoutes;
