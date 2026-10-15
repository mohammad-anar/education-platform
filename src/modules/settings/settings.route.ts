import express from "express";
import validateRequest from "../../middleware/validate.middleware.js";
import { requirePermission } from "../../middleware/auth.middleware.js";
import { SettingsController } from "./settings.controller.js";
import { SettingsValidation } from "./settings.validation.js";

const router = express.Router();

// ==========================================
// 1. USER SETTINGS & SECURITY
// ==========================================

router.get(
  "/me",
  requirePermission("settings.user.view"),
  SettingsController.getMySettings,
);

router.patch(
  "/me",
  requirePermission("settings.user.update"),
  validateRequest(SettingsValidation.updateMySettingsZodSchema),
  SettingsController.updateMySettings,
);

router.post(
  "/change-password",
  requirePermission("settings.user.password"),
  validateRequest(SettingsValidation.changePasswordZodSchema),
  SettingsController.changePassword,
);

router.post(
  "/2fa/enable",
  requirePermission("settings.user.2fa"),
  SettingsController.enable2FA,
);

router.post(
  "/2fa/verify",
  requirePermission("settings.user.2fa"),
  validateRequest(SettingsValidation.verify2FAZodSchema),
  SettingsController.verify2FA,
);

router.post(
  "/2fa/disable",
  requirePermission("settings.user.2fa"),
  validateRequest(SettingsValidation.disable2FAZodSchema),
  SettingsController.disable2FA,
);

// ==========================================
// 2. SESSIONS MANAGEMENT
// ==========================================

router.get(
  "/sessions",
  requirePermission("settings.user.sessions"),
  SettingsController.listMySessions,
);

router.delete(
  "/sessions/:id",
  requirePermission("settings.user.sessions"),
  validateRequest(SettingsValidation.revokeSessionParamZodSchema),
  SettingsController.revokeSession,
);

// ==========================================
// 3. INSTITUTE SETTINGS
// ==========================================

router.get(
  "/institute",
  requirePermission("settings.institute.view"),
  SettingsController.getInstituteSettings,
);

router.patch(
  "/institute",
  requirePermission("settings.institute.manage"),
  validateRequest(SettingsValidation.updateInstituteSettingsZodSchema),
  SettingsController.updateInstituteSettings,
);

router.get(
  "/institute/:section",
  requirePermission("settings.institute.view"),
  validateRequest(SettingsValidation.instituteSectionParamZodSchema),
  SettingsController.getInstituteSectionSettings,
);

router.patch(
  "/institute/:section",
  requirePermission("settings.institute.manage"),
  validateRequest(SettingsValidation.updateInstituteSectionZodSchema),
  SettingsController.updateInstituteSectionSettings,
);

export const SettingsRoutes = router;
export default SettingsRoutes;
