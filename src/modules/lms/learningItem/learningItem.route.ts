import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { LearningItemController } from "./learningItem.controller.js";
import { LearningItemValidation } from "./learningItem.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(LearningItemValidation.createZodSchema),
  LearningItemController.create,
);

router.get(
  "/",
  auth(),
  LearningItemController.getAll,
);

router.get(
  "/:id",
  auth(),
  LearningItemController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(LearningItemValidation.updateZodSchema),
  LearningItemController.update,
);

router.delete(
  "/:id",
  auth(),
  LearningItemController.deleteById,
);

export const LearningItemRoutes = router;
export default LearningItemRoutes;
