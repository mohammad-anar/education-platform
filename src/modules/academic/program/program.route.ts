import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { ProgramController } from "./program.controller.js";
import { ProgramValidation } from "./program.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(ProgramValidation.createZodSchema),
  ProgramController.create,
);

router.get(
  "/",
  auth(),
  ProgramController.getAll,
);

router.get(
  "/:id",
  auth(),
  ProgramController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(ProgramValidation.updateZodSchema),
  ProgramController.update,
);

router.delete(
  "/:id",
  auth(),
  ProgramController.deleteById,
);

export const ProgramRoutes = router;
export default ProgramRoutes;
