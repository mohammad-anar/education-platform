import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { ClassGroupController } from "./classGroup.controller.js";
import { ClassGroupValidation } from "./classGroup.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(ClassGroupValidation.createZodSchema),
  ClassGroupController.create,
);

router.get(
  "/",
  auth(),
  ClassGroupController.getAll,
);

router.get(
  "/:id",
  auth(),
  ClassGroupController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(ClassGroupValidation.updateZodSchema),
  ClassGroupController.update,
);

router.delete(
  "/:id",
  auth(),
  ClassGroupController.deleteById,
);

export const ClassGroupRoutes = router;
export default ClassGroupRoutes;
