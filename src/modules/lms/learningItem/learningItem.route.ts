import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { LearningItemController } from "./learningItem.controller.js";
import { LearningItemValidation } from "./learningItem.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("lms.learningItem.create"),
  validateRequest(LearningItemValidation.createZodSchema),
  LearningItemController.create,
);

router.get(
  "/",
  requirePermission("lms.learningItem.read"),
  LearningItemController.getAll,
);

router.get(
  "/:id",
  requirePermission("lms.learningItem.read"),
  LearningItemController.getById,
);

router.patch(
  "/:id",
  requirePermission("lms.learningItem.update"),
  validateRequest(LearningItemValidation.updateZodSchema),
  LearningItemController.update,
);

router.delete(
  "/:id",
  requirePermission("lms.learningItem.delete"),
  LearningItemController.deleteById,
);

export const LearningItemRoutes = router;
export default LearningItemRoutes;
