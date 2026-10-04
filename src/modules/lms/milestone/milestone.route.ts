import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { MilestoneController } from "./milestone.controller.js";
import { MilestoneValidation } from "./milestone.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(MilestoneValidation.createZodSchema),
  MilestoneController.create,
);

router.get(
  "/",
  auth(),
  MilestoneController.getAll,
);

router.get(
  "/:id",
  auth(),
  MilestoneController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(MilestoneValidation.updateZodSchema),
  MilestoneController.update,
);

router.delete(
  "/:id",
  auth(),
  MilestoneController.deleteById,
);

export const MilestoneRoutes = router;
export default MilestoneRoutes;
