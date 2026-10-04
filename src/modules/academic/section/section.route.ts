import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { SectionController } from "./section.controller.js";
import { SectionValidation } from "./section.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(SectionValidation.createZodSchema),
  SectionController.create,
);

router.get(
  "/",
  auth(),
  SectionController.getAll,
);

router.get(
  "/:id",
  auth(),
  SectionController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(SectionValidation.updateZodSchema),
  SectionController.update,
);

router.delete(
  "/:id",
  auth(),
  SectionController.deleteById,
);

export const SectionRoutes = router;
export default SectionRoutes;
