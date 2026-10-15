import { z } from "zod";

const ThemeEnum = z.enum(["LIGHT", "DARK", "SYSTEM"]);
const VisibilityLevelEnum = z.enum(["HIDDEN", "ENROLLED_STUDENTS", "MEMBERS", "PUBLIC"]);

// ==========================================
// 1. USER SETTINGS VALIDATIONS
// ==========================================

export const notificationPrefsZodSchema = z.record(
  z.string(),
  z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    push: z.boolean().optional(),
    inApp: z.boolean().optional(),
  }),
);

export const updateMySettingsZodSchema = z.object({
  body: z.object({
    language: z.string().min(2).max(10).optional(),
    theme: ThemeEnum.optional(),
    timezone: z.string().min(1).max(50).optional(),
    notificationPrefs: notificationPrefsZodSchema.optional(),
  }),
});

export const changePasswordZodSchema = z.object({
  body: z
    .object({
      oldPassword: z.string().min(6, "Current password must be at least 6 characters"),
      newPassword: z.string().min(6, "New password must be at least 6 characters"),
    })
    .refine((data) => data.oldPassword !== data.newPassword, {
      message: "New password must be different from current password",
      path: ["newPassword"],
    }),
});

export const verify2FAZodSchema = z.object({
  body: z.object({
    token: z.string().min(6, "Code must be at least 6 characters").max(10),
  }),
});

export const disable2FAZodSchema = z.object({
  body: z.object({
    password: z.string().min(1, "Password is required to disable 2FA"),
    token: z.string().optional(),
  }),
});

export const revokeSessionParamZodSchema = z.object({
  params: z.object({
    id: z.string().uuid("Invalid session UUID format"),
  }),
});

// ==========================================
// 2. INSTITUTE SETTINGS SECTION SCHEMAS
// ==========================================

export const attendanceSettingsZodSchema = z.object({
  mode: z.enum(["DAILY", "SUBJECT_WISE", "SLOT_WISE"]).optional(),
  enableSelfCheckIn: z.boolean().optional(),
  selfCheckInWindowMinutes: z.number().int().min(1).max(120).optional(),
  requireGeolocation: z.boolean().optional(),
  allowedRadiusMeters: z.number().int().min(10).max(5000).optional(),
  lateGracePeriodMinutes: z.number().int().min(0).max(180).optional(),
  minimumAttendancePercentage: z.number().min(0).max(100).optional(),
  consecutiveAbsentAlertThreshold: z.number().int().min(1).max(30).optional(),
  notifyGuardiansOnAbsence: z.boolean().optional(),
  notifyGuardiansOnLate: z.boolean().optional(),
  autoMarkAbsentAfterMinutes: z.number().int().min(1).optional(),
});

export const gradingSettingsZodSchema = z.object({
  scaleType: z.enum(["PERCENTAGE", "GPA_4", "GPA_5", "LETTER_GRADE"]).optional(),
  passThresholdPercentage: z.number().min(0).max(100).optional(),
  allowGradeOverrides: z.boolean().optional(),
  requireApprovalForOverrides: z.boolean().optional(),
  roundingRule: z.enum(["ROUND_UP", "ROUND_DOWN", "ROUND_NEAREST"]).optional(),
  decimalPrecision: z.number().int().min(0).max(4).optional(),
  gradeBands: z
    .array(
      z.object({
        label: z.string().min(1),
        minScore: z.number().min(0).max(100),
        maxScore: z.number().min(0).max(100),
        gradePoint: z.number().min(0).optional(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  showRankInClass: z.boolean().optional(),
  showPercentile: z.boolean().optional(),
});

export const supportSettingsZodSchema = z.object({
  isOpen: z.boolean().optional(),
  timezone: z.string().min(1).max(50).optional(),
  allowLiveSession: z.boolean().optional(),
  defaultProvider: z.string().min(1).max(50).optional(),
  allowedMeetingDomains: z.array(z.string().min(1)).optional(),
  openHours: z
    .record(
      z.string(),
      z.object({
        open: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
        close: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM format"),
        closed: z.boolean().optional(),
      }),
    )
    .optional(),
  maxOpenTicketsPerStudent: z.number().int().min(1).max(50).optional(),
  autoCloseResolvedAfterDays: z.number().int().min(1).max(90).optional(),
});

export const brandingSettingsZodSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid HEX color format")
    .optional(),
  secondaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid HEX color format")
    .optional(),
  accentColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid HEX color format")
    .optional(),
  logoUrl: z.string().url("Must be a valid URL").optional(),
  faviconUrl: z.string().url("Must be a valid URL").optional(),
  tagline: z.string().max(250).optional(),
  customDomain: z.string().min(3).max(100).optional(),
  portalTheme: z.enum(["LIGHT", "DARK", "AUTO"]).optional(),
  emailHeaderBannerUrl: z.string().url("Must be a valid URL").optional(),
  footerText: z.string().max(500).optional(),
});

export const visibilitySettingsZodSchema = z.object({
  phone: VisibilityLevelEnum.optional(),
  email: VisibilityLevelEnum.optional(),
  address: VisibilityLevelEnum.optional(),
  facilities: VisibilityLevelEnum.optional(),
  gallery: VisibilityLevelEnum.optional(),
  workingHours: VisibilityLevelEnum.optional(),
  teachersDirectory: VisibilityLevelEnum.optional(),
  staffDirectory: VisibilityLevelEnum.optional(),
});

// Full or partial institute settings update schema
export const updateInstituteSettingsZodSchema = z.object({
  body: z
    .object({
      attendance: attendanceSettingsZodSchema.optional(),
      grading: gradingSettingsZodSchema.optional(),
      support: supportSettingsZodSchema.optional(),
      branding: brandingSettingsZodSchema.optional(),
      visibility: visibilitySettingsZodSchema.optional(),
    })
    .refine(
      (data) =>
        data.attendance !== undefined ||
        data.grading !== undefined ||
        data.support !== undefined ||
        data.branding !== undefined ||
        data.visibility !== undefined,
      {
        message: "At least one settings section (attendance, grading, support, branding, visibility) must be provided",
      },
    ),
});

export const instituteSectionParamZodSchema = z.object({
  params: z.object({
    section: z.enum(["attendance", "grading", "support", "branding", "visibility"]),
  }),
});

export const updateInstituteSectionZodSchema = z.object({
  params: z.object({
    section: z.enum(["attendance", "grading", "support", "branding", "visibility"]),
  }),
  body: z.record(z.string(), z.any()), // dynamically validated against section schema in controller/service
});

export const SettingsValidation = {
  updateMySettingsZodSchema,
  changePasswordZodSchema,
  verify2FAZodSchema,
  disable2FAZodSchema,
  revokeSessionParamZodSchema,
  attendanceSettingsZodSchema,
  gradingSettingsZodSchema,
  supportSettingsZodSchema,
  brandingSettingsZodSchema,
  visibilitySettingsZodSchema,
  updateInstituteSettingsZodSchema,
  instituteSectionParamZodSchema,
  updateInstituteSectionZodSchema,
};

export default SettingsValidation;
