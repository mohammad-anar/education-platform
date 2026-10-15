import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { ProgramController } from "./program.controller.js";
import { ProgramValidation } from "./program.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("academic.program.create"),
  validateRequest(ProgramValidation.createZodSchema),
  ProgramController.create,
);

router.get(
  "/",
  requirePermission("academic.program.read"),
  ProgramController.getAll,
);

router.get(
  "/:id",
  requirePermission("academic.program.read"),
  ProgramController.getById,
);

router.patch(
  "/:id",
  requirePermission("academic.program.update"),
  validateRequest(ProgramValidation.updateZodSchema),
  ProgramController.update,
);

router.delete(
  "/:id",
  requirePermission("academic.program.delete"),
  ProgramController.deleteById,
);

export const ProgramRoutes = router;
export default ProgramRoutes;
