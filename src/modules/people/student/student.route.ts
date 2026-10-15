import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { StudentController } from "./student.controller.js";
import { StudentValidation } from "./student.validation.js";

const router = express.Router();

// -------------------------------------------------------------
// Self-Service Profile Routes (/me) - Mounted BEFORE /:id
// -------------------------------------------------------------
router.get(
  "/me",
  requirePermission("people.student.read"),
  StudentController.getMyProfile,
);

router.patch(
  "/me",
  requirePermission("people.student.update"),
  validateRequest(StudentValidation.selfUpdateZodSchema),
  StudentController.updateMyProfile,
);

router.post(
  "/me/photo",
  requirePermission("people.student.update"),
  validateRequest(StudentValidation.uploadPhotoZodSchema),
  StudentController.uploadProfilePhoto,
);

router.post(
  "/me/documents",
  requirePermission("people.student.update"),
  validateRequest(StudentValidation.addDocumentZodSchema),
  StudentController.addDocument,
);

router.delete(
  "/me/documents/:docId",
  requirePermission("people.student.update"),
  StudentController.removeDocument,
);

router.patch(
  "/me/notification-prefs",
  requirePermission("people.student.update"),
  validateRequest(StudentValidation.updateNotificationPrefsZodSchema),
  StudentController.updateMyNotificationPrefs,
);

router.patch(
  "/me/visibility",
  requirePermission("people.student.update"),
  validateRequest(StudentValidation.updateVisibilityZodSchema),
  StudentController.updateMyVisibility,
);

// -------------------------------------------------------------
// Administrative & Directory Routes
// -------------------------------------------------------------
router.post(
  "/",
  requirePermission("people.student.create"),
  validateRequest(StudentValidation.createZodSchema),
  StudentController.create,
);

router.get(
  "/",
  requirePermission("people.student.read"),
  StudentController.getAll,
);

// @deprecated Superseded by GET /api/v1/student-portal or GET /api/v1/dashboard/guardian/children/:childId
router.get(
  "/:id/stats",
  requirePermission("people.student.stats"),
  StudentController.getStats,
);

router.get(
  "/:id",
  requirePermission("people.student.read"),
  StudentController.getById,
);

router.patch(
  "/:id",
  requirePermission("people.student.update"),
  validateRequest(StudentValidation.adminUpdateZodSchema),
  StudentController.adminUpdateProfile,
);

router.delete(
  "/:id",
  requirePermission("people.student.delete"),
  StudentController.deleteById,
);

export const StudentRoutes = router;
export default StudentRoutes;
