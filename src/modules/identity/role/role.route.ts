import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { RoleController } from "./role.controller.js";
import { RoleValidation } from "./role.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(RoleValidation.createZodSchema),
  RoleController.create,
);

router.get(
  "/",
  auth(),
  RoleController.getAll,
);

router.get(
  "/:id",
  auth(),
  RoleController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(RoleValidation.updateZodSchema),
  RoleController.update,
);

router.delete(
  "/:id",
  auth(),
  RoleController.deleteById,
);

export const RoleRoutes = router;
export default RoleRoutes;
