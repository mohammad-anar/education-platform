import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { SubjectController } from "./subject.controller.js";
import { SubjectValidation } from "./subject.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(SubjectValidation.createZodSchema),
  SubjectController.create,
);

router.get(
  "/",
  auth(),
  SubjectController.getAll,
);

router.get(
  "/:id",
  auth(),
  SubjectController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(SubjectValidation.updateZodSchema),
  SubjectController.update,
);

router.delete(
  "/:id",
  auth(),
  SubjectController.deleteById,
);

export const SubjectRoutes = router;
export default SubjectRoutes;
