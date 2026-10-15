export interface RequestContext {
  userId?: string;
  instituteId?: string | null;
  isPlatformAdmin?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  scope?: string;
  [key: string]: any;
}

export type ThemeType = "LIGHT" | "DARK" | "SYSTEM";

export interface INotificationChannelPrefs {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
}

export type INotificationPrefs = Record<string, INotificationChannelPrefs>;

export interface IUserSettings {
  language: string;
  theme: ThemeType;
  timezone: string;
  notificationPrefs: INotificationPrefs;
  twoFactorEnabled: boolean;
}

export interface IUpdateUserSettingsInput {
  language?: string;
  theme?: ThemeType;
  timezone?: string;
  notificationPrefs?: INotificationPrefs;
}

export interface IChangePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface IEnable2FAResponse {
  secret: string;
  otpauthUrl: string;
  backupCodes: string[];
  expiresInSeconds: number;
}

export interface IVerify2FAInput {
  token: string;
}

export interface IDisable2FAInput {
  password: string;
  token?: string;
}

export interface IUserSessionItem {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  device: string | null;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
}

export type AttendanceMode = "DAILY" | "SUBJECT_WISE" | "SLOT_WISE";

export interface IAttendanceSettings {
  mode?: AttendanceMode;
  enableSelfCheckIn?: boolean;
  selfCheckInWindowMinutes?: number;
  requireGeolocation?: boolean;
  allowedRadiusMeters?: number;
  lateGracePeriodMinutes?: number;
  minimumAttendancePercentage?: number;
  consecutiveAbsentAlertThreshold?: number;
  notifyGuardiansOnAbsence?: boolean;
  notifyGuardiansOnLate?: boolean;
  autoMarkAbsentAfterMinutes?: number;
}

export type GradingScaleType = "PERCENTAGE" | "GPA_4" | "GPA_5" | "LETTER_GRADE";
export type RoundingRule = "ROUND_UP" | "ROUND_DOWN" | "ROUND_NEAREST";

export interface IGradeBand {
  label: string;
  minScore: number;
  maxScore: number;
  gradePoint?: number;
  description?: string;
}

export interface IGradingSettings {
  scaleType?: GradingScaleType;
  passThresholdPercentage?: number;
  allowGradeOverrides?: boolean;
  requireApprovalForOverrides?: boolean;
  roundingRule?: RoundingRule;
  decimalPrecision?: number;
  gradeBands?: IGradeBand[];
  showRankInClass?: boolean;
  showPercentile?: boolean;
}

export interface ISupportScheduleSlot {
  open: string;
  close: string;
  closed?: boolean;
}

export interface ISupportSettings {
  isOpen?: boolean;
  timezone?: string;
  allowLiveSession?: boolean;
  defaultProvider?: string;
  allowedMeetingDomains?: string[];
  openHours?: Record<string, ISupportScheduleSlot>;
  maxOpenTicketsPerStudent?: number;
  autoCloseResolvedAfterDays?: number;
}

export interface IBrandingSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  tagline?: string;
  customDomain?: string;
  portalTheme?: "LIGHT" | "DARK" | "AUTO";
  emailHeaderBannerUrl?: string;
  footerText?: string;
}

export type VisibilityLevel = "HIDDEN" | "ENROLLED_STUDENTS" | "MEMBERS" | "PUBLIC";

export interface IVisibilitySettings {
  phone?: VisibilityLevel;
  email?: VisibilityLevel;
  address?: VisibilityLevel;
  facilities?: VisibilityLevel;
  gallery?: VisibilityLevel;
  workingHours?: VisibilityLevel;
  teachersDirectory?: VisibilityLevel;
  staffDirectory?: VisibilityLevel;
}

export type InstituteSettingsSection =
  | "attendance"
  | "grading"
  | "support"
  | "branding"
  | "visibility";

export interface IInstituteSettingsResponse {
  instituteId: string;
  attendance: IAttendanceSettings;
  grading: IGradingSettings;
  support: ISupportSettings;
  branding: IBrandingSettings;
  visibility: IVisibilitySettings;
  updatedAt: Date;
}

export interface IUpdateInstituteSettingsInput {
  attendance?: IAttendanceSettings;
  grading?: IGradingSettings;
  support?: ISupportSettings;
  branding?: IBrandingSettings;
  visibility?: IVisibilitySettings;
}
