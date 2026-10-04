import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { StaffController } from "./staff.controller.js";
import { StaffValidation } from "./staff.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(StaffValidation.createZodSchema),
  StaffController.create,
);

router.get(
  "/",
  auth(),
  StaffController.getAll,
);

router.get(
  "/:id",
  auth(),
  StaffController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(StaffValidation.updateZodSchema),
  StaffController.update,
);

router.delete(
  "/:id",
  auth(),
  StaffController.deleteById,
);

export const StaffRoutes = router;
export default StaffRoutes;
