import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import cryptoHelper from "../../utils/crypto.js";
import cacheHelper from "../../utils/cache.js";
import { logAudit } from "../../utils/audit.js";
import {
  generateTotpSecret,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
} from "../../utils/totp.js";
import {
  RequestContext,
  IUserSettings,
  IUpdateUserSettingsInput,
  IChangePasswordInput,
  IEnable2FAResponse,
  IVerify2FAInput,
  IDisable2FAInput,
  IUserSessionItem,
  IAttendanceSettings,
  IGradingSettings,
  ISupportSettings,
  IBrandingSettings,
  IVisibilitySettings,
  IInstituteSettingsResponse,
  IUpdateInstituteSettingsInput,
  InstituteSettingsSection,
} from "./settings.interface.js";
import {
  attendanceSettingsZodSchema,
  gradingSettingsZodSchema,
  supportSettingsZodSchema,
  brandingSettingsZodSchema,
  visibilitySettingsZodSchema,
} from "./settings.validation.js";

// ==========================================
// DEFAULT SETTINGS CONSTANTS
// ==========================================

const DEFAULT_ATTENDANCE_SETTINGS: IAttendanceSettings = {
  mode: "DAILY",
  enableSelfCheckIn: false,
  selfCheckInWindowMinutes: 15,
  requireGeolocation: false,
  allowedRadiusMeters: 100,
  lateGracePeriodMinutes: 15,
  minimumAttendancePercentage: 75,
  consecutiveAbsentAlertThreshold: 3,
  notifyGuardiansOnAbsence: true,
  notifyGuardiansOnLate: false,
};

const DEFAULT_GRADING_SETTINGS: IGradingSettings = {
  scaleType: "GPA_4",
  passThresholdPercentage: 40,
  allowGradeOverrides: true,
  requireApprovalForOverrides: true,
  roundingRule: "ROUND_NEAREST",
  decimalPrecision: 2,
  showRankInClass: false,
  showPercentile: false,
};

const DEFAULT_SUPPORT_SETTINGS: ISupportSettings = {
  isOpen: true,
  timezone: "UTC",
  allowLiveSession: true,
  defaultProvider: "GOOGLE_MEET",
  allowedMeetingDomains: ["zoom.us", "meet.google.com"],
  maxOpenTicketsPerStudent: 5,
  autoCloseResolvedAfterDays: 7,
};

const DEFAULT_BRANDING_SETTINGS: IBrandingSettings = {
  portalTheme: "AUTO",
};

const DEFAULT_VISIBILITY_SETTINGS: IVisibilitySettings = {
  phone: "MEMBERS",
  email: "MEMBERS",
  address: "MEMBERS",
  facilities: "PUBLIC",
  gallery: "PUBLIC",
  workingHours: "PUBLIC",
  teachersDirectory: "ENROLLED_STUDENTS",
  staffDirectory: "MEMBERS",
};

// ==========================================
// 1. USER SETTINGS SERVICES
// ==========================================

/**
 * Retrieves the current authenticated user's settings and preferences.
 * Auto-initializes defaults if no settings record exists yet.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @returns {Promise<IUserSettings>}
 */
export async function getMySettings(ctx: RequestContext): Promise<IUserSettings> {
  const userId = ctx.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User context required");
  }

  const [user, userSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, twoFactorEnabled: true },
    }),
    prisma.userSetting.findUnique({
      where: { userId },
    }),
  ]);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!userSetting) {
    return {
      language: "en",
      theme: "SYSTEM",
      timezone: "UTC",
      notificationPrefs: {},
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  return {
    language: userSetting.language,
    theme: (userSetting.theme as any) || "SYSTEM",
    timezone: userSetting.timezone,
    notificationPrefs: (userSetting.notificationPrefs as any) || {},
    twoFactorEnabled: user.twoFactorEnabled,
  };
}

/**
 * Updates the authenticated user's settings (language, theme, timezone, notificationPrefs).
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @param {IUpdateUserSettingsInput} data - Fields to update.
 * @returns {Promise<IUserSettings>}
 */
export async function updateMySettings(
  ctx: RequestContext,
  data: IUpdateUserSettingsInput,
): Promise<IUserSettings> {
  const userId = ctx.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User context required");
  }

  const existing = await prisma.userSetting.findUnique({
    where: { userId },
  });

  const mergedNotificationPrefs = data.notificationPrefs
    ? {
        ...((existing?.notificationPrefs as any) || {}),
        ...data.notificationPrefs,
      }
    : existing?.notificationPrefs;

  const updated = await prisma.userSetting.upsert({
    where: { userId },
    create: {
      userId,
      language: data.language || "en",
      theme: data.theme || "SYSTEM",
      timezone: data.timezone || "UTC",
      notificationPrefs: mergedNotificationPrefs || {},
    },
    update: {
      ...(data.language && { language: data.language }),
      ...(data.theme && { theme: data.theme }),
      ...(data.timezone && { timezone: data.timezone }),
      ...(data.notificationPrefs && { notificationPrefs: mergedNotificationPrefs }),
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true },
  });

  await logAudit({
    ctx,
    action: "USER_SETTINGS_UPDATE",
    entityType: "UserSetting",
    entityId: updated.id,
    oldValue: existing,
    newValue: updated,
  });

  return {
    language: updated.language,
    theme: (updated.theme as any) || "SYSTEM",
    timezone: updated.timezone,
    notificationPrefs: (updated.notificationPrefs as any) || {},
    twoFactorEnabled: user?.twoFactorEnabled ?? false,
  };
}

/**
 * Changes authenticated user's password after verifying their current password.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @param {IChangePasswordInput} payload - Current and new passwords.
 * @returns {Promise<{ message: string }>}
 */
export async function changePassword(
  ctx: RequestContext,
  payload: IChangePasswordInput,
): Promise<{ message: string }> {
  const userId = ctx.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User context required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true },
  });

  if (!user || !user.passwordHash) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User or password configuration not found");
  }

  const isMatched = await cryptoHelper.comparePassword(payload.oldPassword, user.passwordHash);
  if (!isMatched) {
    await logAudit({
      ctx,
      action: "AUTH_CHANGE_PASSWORD_FAILURE",
      entityType: "User",
      entityId: userId,
      newValue: { reason: "Incorrect current password" },
    });
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect current password");
  }

  const newHash = await cryptoHelper.hashPassword(payload.newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  });

  await logAudit({
    ctx,
    action: "AUTH_CHANGE_PASSWORD",
    entityType: "User",
    entityId: userId,
    newValue: { changed: true },
  });

  return { message: "Password changed successfully" };
}

// ==========================================
// 2. TWO-FACTOR AUTHENTICATION (TOTP)
// ==========================================

/**
 * Initiates TOTP 2FA setup by generating a secret, otpauth URL, and 8 backup codes.
 * Temporarily caches the pending setup in Redis for 10 minutes until verified.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @returns {Promise<IEnable2FAResponse>}
 */
export async function enable2FA(ctx: RequestContext): Promise<IEnable2FAResponse> {
  const userId = ctx.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User context required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, twoFactorEnabled: true },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.twoFactorEnabled) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Two-factor authentication is already enabled");
  }

  const { secret, otpauthUrl } = generateTotpSecret(user.email || `user-${userId}`);
  const backupCodes = generateBackupCodes(8);

  // Store pending setup in Redis for 10 minutes (600 seconds)
  const pendingKey = `2fa:pending:${userId}`;
  const pendingData = {
    secret,
    backupCodes,
    createdAt: Date.now(),
  };

  await cacheHelper.set(pendingKey, pendingData, 600);

  return {
    secret,
    otpauthUrl,
    backupCodes,
    expiresInSeconds: 600,
  };
}

/**
 * Verifies a 6-digit TOTP code against the pending setup and commits 2FA to the user account.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @param {IVerify2FAInput} payload - Object containing TOTP token.
 * @returns {Promise<{ message: string; backupCodes: string[] }>}
 */
export async function verify2FA(
  ctx: RequestContext,
  payload: IVerify2FAInput,
): Promise<{ message: string; backupCodes: string[] }> {
  const userId = ctx.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User context required");
  }

  const pendingKey = `2fa:pending:${userId}`;
  const pending = await cacheHelper.get<{ secret: string; backupCodes: string[] }>(pendingKey);

  if (!pending || !pending.secret) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "No pending 2FA setup found or setup session expired. Please start 2FA setup again.",
    );
  }

  const isValid = verifyTotp(payload.token, pending.secret, 1);
  if (!isValid) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid authentication code");
  }

  // Hash backup codes before persisting
  const hashedBackupCodes = pending.backupCodes.map((code) => hashBackupCode(code));

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: pending.secret,
      twoFactorBackupCodes: hashedBackupCodes,
    },
  });

  // Consume pending cache
  await cacheHelper.del(pendingKey);

  await logAudit({
    ctx,
    action: "AUTH_2FA_ENABLED",
    entityType: "User",
    entityId: userId,
    newValue: { twoFactorEnabled: true },
  });

  return {
    message: "Two-factor authentication successfully enabled",
    backupCodes: pending.backupCodes,
  };
}

/**
 * Disables TOTP 2FA after verifying the user's account password.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @param {IDisable2FAInput} payload - Object containing current password.
 * @returns {Promise<{ message: string }>}
 */
export async function disable2FA(
  ctx: RequestContext,
  payload: IDisable2FAInput,
): Promise<{ message: string }> {
  const userId = ctx.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User context required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, passwordHash: true, twoFactorEnabled: true },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!user.twoFactorEnabled) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Two-factor authentication is not enabled");
  }

  if (!user.passwordHash) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Password not configured for this account");
  }

  const isMatched = await cryptoHelper.comparePassword(payload.password, user.passwordHash);
  if (!isMatched) {
    await logAudit({
      ctx,
      action: "AUTH_2FA_DISABLE_FAILURE",
      entityType: "User",
      entityId: userId,
      newValue: { reason: "Incorrect password" },
    });
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect password");
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: [],
    },
  });

  await logAudit({
    ctx,
    action: "AUTH_2FA_DISABLED",
    entityType: "User",
    entityId: userId,
    newValue: { twoFactorEnabled: false },
  });

  return { message: "Two-factor authentication successfully disabled" };
}

// ==========================================
// 3. SESSIONS MANAGEMENT
// ==========================================

/**
 * Lists all active (non-revoked) sessions for the authenticated user.
 * Highlights which session is current based on request context.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @param {string} [currentToken] - The active bearer token header if available.
 * @returns {Promise<IUserSessionItem[]>}
 */
export async function listMySessions(
  ctx: RequestContext,
  currentToken?: string,
): Promise<IUserSessionItem[]> {
  const userId = ctx.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User context required");
  }

  let sessions = await prisma.userSession.findMany({
    where: {
      userId,
      isRevoked: false,
    },
    orderBy: { lastActiveAt: "desc" },
  });

  // If no sessions found in DB yet (e.g. legacy token), auto-create current session
  if (sessions.length === 0) {
    const currentSession = await prisma.userSession.create({
      data: {
        userId,
        ipAddress: ctx.ipAddress || null,
        userAgent: ctx.userAgent || null,
        token: currentToken || null,
        lastActiveAt: new Date(),
      },
    });
    sessions = [currentSession];
  }

  // Determine current session (by token or latest session matching IP/UserAgent)
  let matchedCurrent = false;
  return sessions.map((s, index) => {
    let isCurrent = false;
    if (currentToken && s.token && s.token === currentToken) {
      isCurrent = true;
      matchedCurrent = true;
    } else if (!matchedCurrent && index === 0) {
      // First session in list if no token match
      isCurrent = true;
    }

    return {
      id: s.id,
      ipAddress: s.ipAddress,
      userAgent: s.userAgent,
      device: s.device,
      createdAt: s.createdAt,
      lastActiveAt: s.lastActiveAt,
      isCurrent,
    };
  });
}

/**
 * Revokes a user session by ID, marking it revoked in DB and blacklisting token in Redis.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @param {string} sessionId - The UUID of the session to revoke.
 * @returns {Promise<{ message: string }>}
 */
export async function revokeSession(
  ctx: RequestContext,
  sessionId: string,
): Promise<{ message: string }> {
  const userId = ctx.userId;
  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User context required");
  }

  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Session not found");
  }

  if (session.isRevoked) {
    return { message: "Session already revoked" };
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isRevoked: true },
  });

  if (session.token) {
    await cacheHelper.blacklistToken(session.token, 86400);
  }

  await logAudit({
    ctx,
    action: "AUTH_SESSION_REVOKED",
    entityType: "UserSession",
    entityId: sessionId,
    newValue: { isRevoked: true },
  });

  return { message: "Session revoked successfully" };
}

// ==========================================
// 4. INSTITUTE SETTINGS SERVICES
// ==========================================

/**
 * Retrieves the complete settings for an institute across all 5 JSON sections.
 *
 * @param {string} instituteId - The target institute UUID.
 * @returns {Promise<IInstituteSettingsResponse>}
 */
export async function getInstituteSettings(
  instituteId: string,
): Promise<IInstituteSettingsResponse> {
  const [instituteSetting, supportSetting, publicProfile] = await Promise.all([
    prisma.instituteSetting.findUnique({
      where: { instituteId },
    }),
    prisma.instituteSupportSetting.findUnique({
      where: { instituteId },
    }),
    prisma.institutePublicProfile.findUnique({
      where: { instituteId },
      select: { contactVisibility: true },
    }),
  ]);

  const attendance = (instituteSetting?.attendanceSettings as any) || DEFAULT_ATTENDANCE_SETTINGS;
  const grading = (instituteSetting?.gradingSettings as any) || DEFAULT_GRADING_SETTINGS;
  const branding = (instituteSetting?.brandingSettings as any) || DEFAULT_BRANDING_SETTINGS;

  // Synthesize support settings from InstituteSetting or dedicated InstituteSupportSetting
  const rawSupport = (instituteSetting?.supportSettings as any) || supportSetting;
  const support: ISupportSettings = rawSupport
    ? {
        isOpen: rawSupport.isOpen ?? DEFAULT_SUPPORT_SETTINGS.isOpen,
        timezone: rawSupport.timezone ?? DEFAULT_SUPPORT_SETTINGS.timezone,
        allowLiveSession: rawSupport.allowLiveSession ?? DEFAULT_SUPPORT_SETTINGS.allowLiveSession,
        defaultProvider: rawSupport.defaultProvider ?? DEFAULT_SUPPORT_SETTINGS.defaultProvider,
        allowedMeetingDomains:
          rawSupport.allowedMeetingDomains ?? DEFAULT_SUPPORT_SETTINGS.allowedMeetingDomains,
        openHours: (rawSupport.openHours as any) ?? undefined,
        maxOpenTicketsPerStudent: rawSupport.maxOpenTicketsPerStudent ?? 5,
        autoCloseResolvedAfterDays: rawSupport.autoCloseResolvedAfterDays ?? 7,
      }
    : DEFAULT_SUPPORT_SETTINGS;

  // Synthesize visibility settings
  const rawVis = (instituteSetting?.visibilitySettings as any) || (publicProfile?.contactVisibility as any);
  const visibility: IVisibilitySettings = rawVis
    ? {
        phone: rawVis.phone || DEFAULT_VISIBILITY_SETTINGS.phone,
        email: rawVis.email || DEFAULT_VISIBILITY_SETTINGS.email,
        address: rawVis.address || DEFAULT_VISIBILITY_SETTINGS.address,
        facilities: rawVis.facilities || DEFAULT_VISIBILITY_SETTINGS.facilities,
        gallery: rawVis.gallery || DEFAULT_VISIBILITY_SETTINGS.gallery,
        workingHours: rawVis.workingHours || DEFAULT_VISIBILITY_SETTINGS.workingHours,
        teachersDirectory: rawVis.teachersDirectory || DEFAULT_VISIBILITY_SETTINGS.teachersDirectory,
        staffDirectory: rawVis.staffDirectory || DEFAULT_VISIBILITY_SETTINGS.staffDirectory,
      }
    : DEFAULT_VISIBILITY_SETTINGS;

  return {
    instituteId,
    attendance,
    grading,
    support,
    branding,
    visibility,
    updatedAt: instituteSetting?.updatedAt || new Date(),
  };
}

/**
 * Updates one or more institute settings sections with strict per-section Zod validation.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @param {IUpdateInstituteSettingsInput} payload - Settings payload per section.
 * @returns {Promise<IInstituteSettingsResponse>}
 */
export async function updateInstituteSettings(
  ctx: RequestContext,
  payload: IUpdateInstituteSettingsInput,
): Promise<IInstituteSettingsResponse> {
  const instituteId = ctx.instituteId;
  if (!instituteId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Institute context required");
  }

  // 1. Strict validation per section if present
  if (payload.attendance !== undefined) {
    attendanceSettingsZodSchema.parse(payload.attendance);
  }
  if (payload.grading !== undefined) {
    gradingSettingsZodSchema.parse(payload.grading);
  }
  if (payload.support !== undefined) {
    supportSettingsZodSchema.parse(payload.support);
  }
  if (payload.branding !== undefined) {
    brandingSettingsZodSchema.parse(payload.branding);
  }
  if (payload.visibility !== undefined) {
    visibilitySettingsZodSchema.parse(payload.visibility);
  }

  const existing = await prisma.instituteSetting.findUnique({
    where: { instituteId },
  });

  const mergedAttendance = payload.attendance
    ? { ...((existing?.attendanceSettings as any) || {}), ...payload.attendance }
    : existing?.attendanceSettings;

  const mergedGrading = payload.grading
    ? { ...((existing?.gradingSettings as any) || {}), ...payload.grading }
    : existing?.gradingSettings;

  const mergedBranding = payload.branding
    ? { ...((existing?.brandingSettings as any) || {}), ...payload.branding }
    : existing?.brandingSettings;

  const mergedSupport = payload.support
    ? { ...((existing?.supportSettings as any) || {}), ...payload.support }
    : existing?.supportSettings;

  const mergedVisibility = payload.visibility
    ? { ...((existing?.visibilitySettings as any) || {}), ...payload.visibility }
    : existing?.visibilitySettings;

  // Update or upsert InstituteSetting
  const updatedSetting = await prisma.instituteSetting.upsert({
    where: { instituteId },
    create: {
      instituteId,
      attendanceSettings: mergedAttendance || DEFAULT_ATTENDANCE_SETTINGS,
      gradingSettings: mergedGrading || DEFAULT_GRADING_SETTINGS,
      brandingSettings: mergedBranding || DEFAULT_BRANDING_SETTINGS,
      supportSettings: mergedSupport || DEFAULT_SUPPORT_SETTINGS,
      visibilitySettings: mergedVisibility || DEFAULT_VISIBILITY_SETTINGS,
    },
    update: {
      ...(payload.attendance && { attendanceSettings: mergedAttendance }),
      ...(payload.grading && { gradingSettings: mergedGrading }),
      ...(payload.branding && { brandingSettings: mergedBranding }),
      ...(payload.support && { supportSettings: mergedSupport }),
      ...(payload.visibility && { visibilitySettings: mergedVisibility }),
    },
  });

  // Sync with dedicated InstituteSupportSetting if support section changed
  if (payload.support) {
    await prisma.instituteSupportSetting.upsert({
      where: { instituteId },
      create: {
        instituteId,
        isOpen: payload.support.isOpen ?? true,
        timezone: payload.support.timezone || "UTC",
        allowLiveSession: payload.support.allowLiveSession ?? true,
        defaultProvider: payload.support.defaultProvider || "GOOGLE_MEET",
        allowedMeetingDomains: payload.support.allowedMeetingDomains || [
          "zoom.us",
          "meet.google.com",
        ],
        openHours: (payload.support.openHours as any) || undefined,
      },
      update: {
        ...(payload.support.isOpen !== undefined && { isOpen: payload.support.isOpen }),
        ...(payload.support.timezone && { timezone: payload.support.timezone }),
        ...(payload.support.allowLiveSession !== undefined && {
          allowLiveSession: payload.support.allowLiveSession,
        }),
        ...(payload.support.defaultProvider && {
          defaultProvider: payload.support.defaultProvider,
        }),
        ...(payload.support.allowedMeetingDomains && {
          allowedMeetingDomains: payload.support.allowedMeetingDomains,
        }),
        ...(payload.support.openHours && { openHours: payload.support.openHours as any }),
      },
    });
  }

  // Sync with InstitutePublicProfile if visibility changed
  if (payload.visibility) {
    await prisma.institutePublicProfile.upsert({
      where: { instituteId },
      create: {
        instituteId,
        contactVisibility: payload.visibility as any,
      },
      update: {
        contactVisibility: payload.visibility as any,
      },
    });
  }

  await logAudit({
    ctx,
    action: "INSTITUTE_SETTINGS_UPDATE",
    entityType: "InstituteSetting",
    entityId: updatedSetting.id,
    oldValue: existing,
    newValue: updatedSetting,
  });

  return getInstituteSettings(instituteId);
}

/**
 * Retrieves a single section of institute settings.
 *
 * @param {string} instituteId - The institute UUID.
 * @param {InstituteSettingsSection} section - The section name.
 * @returns {Promise<any>}
 */
export async function getInstituteSectionSettings(
  instituteId: string,
  section: InstituteSettingsSection,
): Promise<any> {
  const settings = await getInstituteSettings(instituteId);
  return settings[section];
}

/**
 * Updates a single section of institute settings.
 *
 * @param {RequestContext} ctx - Authenticated request context.
 * @param {InstituteSettingsSection} section - The section name.
 * @param {any} sectionData - The payload for that section.
 * @returns {Promise<any>}
 */
export async function updateInstituteSectionSettings(
  ctx: RequestContext,
  section: InstituteSettingsSection,
  sectionData: any,
): Promise<any> {
  const updated = await updateInstituteSettings(ctx, { [section]: sectionData });
  return updated[section];
}

export const SettingsService = {
  getMySettings,
  updateMySettings,
  changePassword,
  enable2FA,
  verify2FA,
  disable2FA,
  listMySessions,
  revokeSession,
  getInstituteSettings,
  updateInstituteSettings,
  getInstituteSectionSettings,
  updateInstituteSectionSettings,
};

export default SettingsService;
