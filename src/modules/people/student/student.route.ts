import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { StudentController } from "./student.controller.js";
import { StudentValidation } from "./student.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(StudentValidation.createZodSchema),
  StudentController.create,
);

router.get(
  "/",
  auth(),
  StudentController.getAll,
);

router.get(
  "/:id/stats",
  auth(),
  StudentController.getStats,
);

router.get(
  "/:id",
  auth(),
  StudentController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(StudentValidation.updateZodSchema),
  StudentController.update,
);

router.delete(
  "/:id",
  auth(),
  StudentController.deleteById,
);

export const StudentRoutes = router;
export default StudentRoutes;
