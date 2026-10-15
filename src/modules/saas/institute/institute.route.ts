import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { InstituteController } from "./institute.controller.js";
import { InstituteValidation } from "./institute.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("saas.institute.create"),
  validateRequest(InstituteValidation.createZodSchema),
  InstituteController.create,
);

router.get(
  "/",
  requirePermission("saas.institute.read"),
  InstituteController.getAll,
);

// @deprecated Superseded by GET /api/v1/dashboard/admin (Role Dashboards)
router.get(
  "/:id/stats",
  requirePermission("saas.institute.stats"),
  InstituteController.getStats,
);

router.patch(
  "/:id/settings",
  requirePermission("saas.institute.settings"),
  InstituteController.updateSettings,
);

router.get(
  "/:id",
  requirePermission("saas.institute.read"),
  InstituteController.getById,
);

router.patch(
  "/:id",
  requirePermission("saas.institute.update"),
  validateRequest(InstituteValidation.updateZodSchema),
  InstituteController.update,
);

router.post(
  "/:id/suspend",
  requirePermission("saas.institute.suspend"),
  InstituteController.suspend,
);

router.delete(
  "/:id",
  requirePermission("saas.institute.delete"),
  InstituteController.deleteById,
);

export const InstituteRoutes = router;
export default InstituteRoutes;
