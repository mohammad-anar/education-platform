import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { AcademicYearController } from "./academicYear.controller.js";
import { AcademicYearValidation } from "./academicYear.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(AcademicYearValidation.createZodSchema),
  AcademicYearController.create,
);

router.get(
  "/",
  auth(),
  AcademicYearController.getAll,
);

router.get(
  "/:id",
  auth(),
  AcademicYearController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(AcademicYearValidation.updateZodSchema),
  AcademicYearController.update,
);

router.delete(
  "/:id",
  auth(),
  AcademicYearController.deleteById,
);

export const AcademicYearRoutes = router;
export default AcademicYearRoutes;
