import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { TeacherController } from "./teacher.controller.js";
import { TeacherValidation } from "./teacher.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(TeacherValidation.createZodSchema),
  TeacherController.create,
);

router.get(
  "/",
  auth(),
  TeacherController.getAll,
);

router.get(
  "/:id",
  auth(),
  TeacherController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(TeacherValidation.updateZodSchema),
  TeacherController.update,
);

router.delete(
  "/:id",
  auth(),
  TeacherController.deleteById,
);

export const TeacherRoutes = router;
export default TeacherRoutes;
