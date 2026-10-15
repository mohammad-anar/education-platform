import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { SubjectController } from "./subject.controller.js";
import { SubjectValidation } from "./subject.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("academic.subject.create"),
  validateRequest(SubjectValidation.createZodSchema),
  SubjectController.create,
);

router.get(
  "/",
  requirePermission("academic.subject.read"),
  SubjectController.getAll,
);

router.get(
  "/:id",
  requirePermission("academic.subject.read"),
  SubjectController.getById,
);

router.patch(
  "/:id",
  requirePermission("academic.subject.update"),
  validateRequest(SubjectValidation.updateZodSchema),
  SubjectController.update,
);

router.delete(
  "/:id",
  requirePermission("academic.subject.delete"),
  SubjectController.deleteById,
);

export const SubjectRoutes = router;
export default SubjectRoutes;
