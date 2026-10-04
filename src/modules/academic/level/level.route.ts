import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { LevelController } from "./level.controller.js";
import { LevelValidation } from "./level.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(LevelValidation.createZodSchema),
  LevelController.create,
);

router.get(
  "/",
  auth(),
  LevelController.getAll,
);

router.get(
  "/:id",
  auth(),
  LevelController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(LevelValidation.updateZodSchema),
  LevelController.update,
);

router.delete(
  "/:id",
  auth(),
  LevelController.deleteById,
);

export const LevelRoutes = router;
export default LevelRoutes;
