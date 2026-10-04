import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { UserController } from "./user.controller.js";
import { UserValidation } from "./user.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(UserValidation.createZodSchema),
  UserController.create,
);

router.get(
  "/",
  auth(),
  UserController.getAll,
);

router.get(
  "/:id",
  auth(),
  UserController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(UserValidation.updateZodSchema),
  UserController.update,
);

router.delete(
  "/:id",
  auth(),
  UserController.deleteById,
);

export const UserRoutes = router;
export default UserRoutes;
