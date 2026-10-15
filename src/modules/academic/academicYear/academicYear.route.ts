import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { AcademicYearController } from "./academicYear.controller.js";
import { AcademicYearValidation } from "./academicYear.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("academic.academicYear.create"),
  validateRequest(AcademicYearValidation.createZodSchema),
  AcademicYearController.create,
);

router.get(
  "/",
  requirePermission("academic.academicYear.read"),
  AcademicYearController.getAll,
);

router.get(
  "/:id",
  requirePermission("academic.academicYear.read"),
  AcademicYearController.getById,
);

router.patch(
  "/:id",
  requirePermission("academic.academicYear.update"),
  validateRequest(AcademicYearValidation.updateZodSchema),
  AcademicYearController.update,
);

router.delete(
  "/:id",
  requirePermission("academic.academicYear.delete"),
  AcademicYearController.deleteById,
);

export const AcademicYearRoutes = router;
export default AcademicYearRoutes;
