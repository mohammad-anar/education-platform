import express from "express";
import validateRequest from "../../middleware/validate.middleware.js";
import { requirePermission } from "../../middleware/auth.middleware.js";
import { DirectoryController } from "./directory.controller.js";
import { DirectoryValidation } from "./directory.validation.js";

const router = express.Router();

// -------------------------------------------------------------
// Teachers Directory
// -------------------------------------------------------------
router.get(
  "/teachers",
  requirePermission("directory.teacher.view"),
  DirectoryController.getTeachers,
);

// Self-update visibility (mounted before /teachers/:id)
router.patch(
  "/teachers/me/visibility",
  requirePermission("people.teacher.update"),
  validateRequest(DirectoryValidation.updateTeacherVisibilityZodSchema),
  DirectoryController.updateTeacherVisibility,
);

router.get(
  "/teachers/:id",
  requirePermission("directory.teacher.view"),
  DirectoryController.getTeacherById,
);

// -------------------------------------------------------------
// Staff Directory
// -------------------------------------------------------------
router.get(
  "/staff",
  requirePermission("directory.staff.view"),
  DirectoryController.getStaff,
);

// -------------------------------------------------------------
// Institute Public Profile & Contact Visibility
// -------------------------------------------------------------
router.get(
  "/institute/public-profile",
  requirePermission("directory.institute.view"),
  DirectoryController.getInstitutePublicProfile,
);

router.patch(
  "/institute/contact-visibility",
  requirePermission("saas.institute.settings"),
  validateRequest(DirectoryValidation.updateInstituteContactVisibilityZodSchema),
  DirectoryController.updateInstituteContactVisibility,
);

export const DirectoryRoutes = router;
export default DirectoryRoutes;
