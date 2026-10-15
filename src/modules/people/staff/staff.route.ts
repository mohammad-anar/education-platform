import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { StaffController } from "./staff.controller.js";
import { StaffValidation } from "./staff.validation.js";

const router = express.Router();

// -------------------------------------------------------------
// Self-Service Profile Routes (/me) - Mounted BEFORE /:id
// -------------------------------------------------------------
router.get(
  "/me",
  requirePermission("people.staff.read"),
  StaffController.getMyProfile,
);

router.patch(
  "/me",
  requirePermission("people.staff.update"),
  validateRequest(StaffValidation.selfUpdateZodSchema),
  StaffController.updateMyProfile,
);

router.post(
  "/me/photo",
  requirePermission("people.staff.update"),
  validateRequest(StaffValidation.uploadPhotoZodSchema),
  StaffController.uploadProfilePhoto,
);

router.post(
  "/me/documents",
  requirePermission("people.staff.update"),
  validateRequest(StaffValidation.addDocumentZodSchema),
  StaffController.addDocument,
);

router.delete(
  "/me/documents/:docId",
  requirePermission("people.staff.update"),
  StaffController.removeDocument,
);

router.patch(
  "/me/notification-prefs",
  requirePermission("people.staff.update"),
  validateRequest(StaffValidation.updateNotificationPrefsZodSchema),
  StaffController.updateMyNotificationPrefs,
);

router.patch(
  "/me/visibility",
  requirePermission("people.staff.update"),
  validateRequest(StaffValidation.updateVisibilityZodSchema),
  StaffController.updateMyVisibility,
);

// -------------------------------------------------------------
// Administrative & Directory Routes
// -------------------------------------------------------------
router.post(
  "/",
  requirePermission("people.staff.create"),
  validateRequest(StaffValidation.createZodSchema),
  StaffController.create,
);

router.get(
  "/",
  requirePermission("people.staff.read"),
  StaffController.getAll,
);

router.get(
  "/:id",
  requirePermission("people.staff.read"),
  StaffController.getById,
);

router.patch(
  "/:id",
  requirePermission("people.staff.update"),
  validateRequest(StaffValidation.adminUpdateZodSchema),
  StaffController.adminUpdateProfile,
);

router.delete(
  "/:id",
  requirePermission("people.staff.delete"),
  StaffController.deleteById,
);

export const StaffRoutes = router;
export default StaffRoutes;
