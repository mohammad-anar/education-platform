import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { InstituteController } from "./institute.controller.js";
import { InstituteValidation } from "./institute.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(InstituteValidation.createZodSchema),
  InstituteController.create,
);

router.get(
  "/",
  auth(),
  InstituteController.getAll,
);

router.get(
  "/:id/stats",
  auth(),
  InstituteController.getStats,
);

router.patch(
  "/:id/settings",
  auth(),
  InstituteController.updateSettings,
);

router.get(
  "/:id",
  auth(),
  InstituteController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(InstituteValidation.updateZodSchema),
  InstituteController.update,
);

router.delete(
  "/:id",
  auth(),
  InstituteController.deleteById,
);

export const InstituteRoutes = router;
export default InstituteRoutes;
