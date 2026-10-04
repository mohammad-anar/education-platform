import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { CourseController } from "./course.controller.js";
import { CourseValidation } from "./course.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(CourseValidation.createZodSchema),
  CourseController.create,
);

router.get(
  "/",
  auth(),
  CourseController.getAll,
);

router.get(
  "/:id",
  auth(),
  CourseController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(CourseValidation.updateZodSchema),
  CourseController.update,
);

router.delete(
  "/:id",
  auth(),
  CourseController.deleteById,
);

export const CourseRoutes = router;
export default CourseRoutes;
