import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { PolicyController } from "./policy.controller.js";
import { PolicyValidation } from "./policy.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(PolicyValidation.createZodSchema),
  PolicyController.create,
);

router.get(
  "/",
  auth(),
  PolicyController.getAll,
);

router.get(
  "/:id",
  auth(),
  PolicyController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(PolicyValidation.updateZodSchema),
  PolicyController.update,
);

router.delete(
  "/:id",
  auth(),
  PolicyController.deleteById,
);

export const PolicyRoutes = router;
export default PolicyRoutes;
