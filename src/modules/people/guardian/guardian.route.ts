import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { GuardianController } from "./guardian.controller.js";
import { GuardianValidation } from "./guardian.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(GuardianValidation.createZodSchema),
  GuardianController.create,
);

router.get(
  "/",
  auth(),
  GuardianController.getAll,
);

router.get(
  "/:id",
  auth(),
  GuardianController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(GuardianValidation.updateZodSchema),
  GuardianController.update,
);

router.delete(
  "/:id",
  auth(),
  GuardianController.deleteById,
);

export const GuardianRoutes = router;
export default GuardianRoutes;
