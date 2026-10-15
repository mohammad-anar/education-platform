import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { TeacherController } from "./teacher.controller.js";
import { TeacherValidation } from "./teacher.validation.js";

const router = express.Router();

// -------------------------------------------------------------
// Self-Service Profile Routes (/me) - Mounted BEFORE /:id
// -------------------------------------------------------------
router.get(
  "/me",
  requirePermission("people.teacher.read"),
  TeacherController.getMyProfile,
);

router.patch(
  "/me",
  requirePermission("people.teacher.update"),
  validateRequest(TeacherValidation.selfUpdateZodSchema),
  TeacherController.updateMyProfile,
);

router.post(
  "/me/photo",
  requirePermission("people.teacher.update"),
  validateRequest(TeacherValidation.uploadPhotoZodSchema),
  TeacherController.uploadProfilePhoto,
);

router.post(
  "/me/qualifications",
  requirePermission("people.teacher.update"),
  validateRequest(TeacherValidation.addQualificationZodSchema),
  TeacherController.addQualification,
);

router.delete(
  "/me/qualifications/:qualId",
  requirePermission("people.teacher.update"),
  TeacherController.removeQualification,
);

router.patch(
  "/me/notification-prefs",
  requirePermission("people.teacher.update"),
  validateRequest(TeacherValidation.updateNotificationPrefsZodSchema),
  TeacherController.updateMyNotificationPrefs,
);

router.patch(
  "/me/visibility",
  requirePermission("people.teacher.update"),
  validateRequest(TeacherValidation.updateVisibilityZodSchema),
  TeacherController.updateMyVisibility,
);

// -------------------------------------------------------------
// Administrative & Directory Routes
// -------------------------------------------------------------
router.post(
  "/",
  requirePermission("people.teacher.create"),
  validateRequest(TeacherValidation.createZodSchema),
  TeacherController.create,
);

router.get(
  "/",
  requirePermission("people.teacher.read"),
  TeacherController.getAll,
);

router.get(
  "/:id",
  requirePermission("people.teacher.read"),
  TeacherController.getById,
);

router.patch(
  "/:id",
  requirePermission("people.teacher.update"),
  validateRequest(TeacherValidation.adminUpdateZodSchema),
  TeacherController.adminUpdateProfile,
);

router.delete(
  "/:id",
  requirePermission("people.teacher.delete"),
  TeacherController.deleteById,
);

export const TeacherRoutes = router;
export default TeacherRoutes;
