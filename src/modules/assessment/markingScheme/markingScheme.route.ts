import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { MarkingSchemeController } from "./markingScheme.controller.js";
import { MarkingSchemeValidation } from "./markingScheme.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(MarkingSchemeValidation.createZodSchema),
  MarkingSchemeController.create,
);

router.get(
  "/",
  auth(),
  MarkingSchemeController.getAll,
);

router.get(
  "/:id",
  auth(),
  MarkingSchemeController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(MarkingSchemeValidation.updateZodSchema),
  MarkingSchemeController.update,
);

router.delete(
  "/:id",
  auth(),
  MarkingSchemeController.deleteById,
);

export const MarkingSchemeRoutes = router;
export default MarkingSchemeRoutes;
