import { z } from "zod";
import { registerRoute, successResponse } from "../helpers.js";
import { SettingsValidation } from "../../../modules/settings/settings.validation.js";
import { IdParamSchema } from "../components.js";

const UserSettingsSchema = z.object({
  language: z.string().openapi({ example: "bn" }),
  theme: z.enum(["LIGHT", "DARK", "SYSTEM"]).openapi({ example: "LIGHT" }),
  timezone: z.string().openapi({ example: "Asia/Dhaka" }),
  notificationPrefs: z.object({
    email: z.boolean().openapi({ example: true }),
    push: z.boolean().openapi({ example: true }),
    sms: z.boolean().openapi({ example: false }),
  }),
});

const SessionItemSchema = z.object({
  id: z.string().openapi({ example: "cly01ses_dev_chrm" }),
  ipAddress: z.string().openapi({ example: "103.145.120.45" }),
  userAgent: z.string().openapi({ example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/129.0.0.0" }),
  isCurrent: z.boolean().openapi({ example: true }),
  lastActiveAt: z.string().openapi({ example: "2026-10-18T08:15:00.000Z" }),
  createdAt: z.string().openapi({ example: "2026-10-18T06:00:00.000Z" }),
});

const InstituteSettingsSchema = z.object({
  attendance: z.object({
    enableSmsAlertOnAbsence: z.boolean().openapi({ example: true }),
    minimumRequiredPercentage: z.number().openapi({ example: 75.0 }),
  }),
  grading: z.object({
    defaultGradingSystemId: z.string().openapi({ example: "cly01grd_nctb" }),
    allowTeacherScoreOverride: z.boolean().openapi({ example: false }),
  }),
  branding: z.object({
    primaryColor: z.string().openapi({ example: "#0D9488" }),
    accentColor: z.string().openapi({ example: "#F59E0B" }),
    logoUrl: z.string().openapi({ example: "https://assets.education.bd/logos/drmc.png" }),
  }),
});

// 1. User Settings
registerRoute({
  method: "get",
  path: "/api/v1/settings/me",
  tag: "Settings",
  summary: "Get current user personal preferences and notification settings",
  permission: "settings.user.view",
  scope: "OWN",
  operationId: "settingsGetMySettings",
  responses: {
    200: {
      description: "User settings",
      content: {
        "application/json": {
          schema: successResponse(UserSettingsSchema, "Settings retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "patch",
  path: "/api/v1/settings/me",
  tag: "Settings",
  summary: "Update current user preferences (language, theme, timezone)",
  permission: "settings.user.update",
  scope: "OWN",
  operationId: "settingsUpdateMySettings",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SettingsValidation.updateMySettingsZodSchema,
          example: {
            language: "bn",
            theme: "SYSTEM",
            timezone: "Asia/Dhaka",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Settings updated successfully",
      content: {
        "application/json": {
          schema: successResponse(UserSettingsSchema, "Settings updated"),
        },
      },
    },
  },
});

// 2. 2FA Security
registerRoute({
  method: "post",
  path: "/api/v1/settings/2fa/enable",
  tag: "Settings",
  summary: "Initialize TOTP 2-Factor Authentication (returns QR code & secret)",
  permission: "settings.user.2fa",
  scope: "OWN",
  auditLogged: true,
  operationId: "settingsEnable2FA",
  responses: {
    200: {
      description: "TOTP provisioning secret and QR data URI",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              secret: z.string().openapi({ example: "JBSWY3DPEHPK3PXP" }),
              qrCodeUrl: z.string().openapi({ example: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." }),
            }),
            "2FA setup initiated"
          ),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/settings/2fa/verify",
  tag: "Settings",
  summary: "Verify and activate TOTP 2-Factor Authentication",
  permission: "settings.user.2fa",
  scope: "OWN",
  auditLogged: true,
  operationId: "settingsVerify2FA",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SettingsValidation.verify2FAZodSchema,
          example: {
            code: "542918",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "2FA verified and enabled",
      content: {
        "application/json": {
          schema: successResponse(z.object({ enabled: z.boolean() }), "2FA enabled successfully"),
        },
      },
    },
  },
});

// 3. Sessions
registerRoute({
  method: "get",
  path: "/api/v1/settings/sessions",
  tag: "Settings",
  summary: "List active login sessions across devices",
  permission: "settings.user.sessions",
  scope: "OWN",
  operationId: "settingsListMySessions",
  responses: {
    200: {
      description: "Active user sessions",
      content: {
        "application/json": {
          schema: successResponse(z.array(SessionItemSchema), "Sessions retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "delete",
  path: "/api/v1/settings/sessions/:id",
  tag: "Settings",
  summary: "Revoke active login session",
  permission: "settings.user.sessions",
  scope: "OWN",
  auditLogged: true,
  operationId: "settingsRevokeSession",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "Session revoked",
      content: {
        "application/json": {
          schema: successResponse(z.object({ revoked: z.boolean() }), "Session revoked"),
        },
      },
    },
  },
});

// 4. Institute Settings
registerRoute({
  method: "get",
  path: "/api/v1/settings/institute",
  tag: "Settings",
  summary: "Get institute configuration sections (branding, attendance, grading)",
  permission: "settings.institute.view",
  scope: "INSTITUTE",
  operationId: "settingsGetInstituteSettings",
  responses: {
    200: {
      description: "Institute configuration schema",
      content: {
        "application/json": {
          schema: successResponse(InstituteSettingsSchema, "Institute settings retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "patch",
  path: "/api/v1/settings/institute",
  tag: "Settings",
  summary: "Update institutional settings with strict JSON schema validation",
  permission: "settings.institute.manage",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "settingsUpdateInstituteSettings",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SettingsValidation.updateInstituteSettingsZodSchema,
          example: {
            attendance: {
              enableSmsAlertOnAbsence: true,
              minimumRequiredPercentage: 75.0,
            },
            branding: {
              primaryColor: "#0D9488",
            },
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Institute settings saved successfully",
      content: {
        "application/json": {
          schema: successResponse(InstituteSettingsSchema, "Institute settings updated"),
        },
      },
    },
  },
});
