import { describe, it, expect, vi, beforeEach } from "vitest";
import prisma from "../../config/prisma.js";
import cacheHelper from "../../utils/cache.js";
import cryptoHelper from "../../utils/crypto.js";
import {
  base32Encode,
  base32Decode,
  generateTotpSecret,
  verifyTotp,
  generateBackupCodes,
  hashBackupCode,
  generateHotp,
} from "../../utils/totp.js";
import {
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
} from "./settings.service.js";
import {
  attendanceSettingsZodSchema,
  gradingSettingsZodSchema,
  supportSettingsZodSchema,
  brandingSettingsZodSchema,
  visibilitySettingsZodSchema,
  updateInstituteSettingsZodSchema,
} from "./settings.validation.js";

// Mock prisma and cacheHelper
vi.mock("../../config/prisma.js", () => {
  return {
    default: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      userSetting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      userSession: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      instituteSetting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      instituteSupportSetting: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      institutePublicProfile: {
        findUnique: vi.fn(),
        upsert: vi.fn(),
      },
      auditLog: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock("../../utils/cache.js", () => {
  const store = new Map<string, any>();
  return {
    default: {
      get: vi.fn(async (key: string) => store.get(key) || null),
      set: vi.fn(async (key: string, val: any) => {
        store.set(key, val);
        return true;
      }),
      del: vi.fn(async (key: string) => {
        store.delete(key);
        return true;
      }),
      blacklistToken: vi.fn(async () => {}),
      isTokenBlacklisted: vi.fn(async () => false),
    },
  };
});

describe("STEP 12: SETTINGS DOMAIN", () => {
  const mockCtx = {
    userId: "user-123",
    instituteId: "inst-123",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 Vitest",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // 1. TOTP RFC 6238 UTILITIES
  // ==========================================
  describe("TOTP Utilities", () => {
    it("round-trips Base32 encode and decode", () => {
      const buffer = Buffer.from("Hello world! Secret key testing 123");
      const encoded = base32Encode(buffer);
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);

      const decoded = base32Decode(encoded);
      expect(decoded.toString()).toBe(buffer.toString());
    });

    it("generates a valid TOTP secret and otpauth URL", () => {
      const result = generateTotpSecret("user@example.com", "EduPlatform");
      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBe(32);
      expect(result.otpauthUrl).toContain("otpauth://totp/EduPlatform:user%40example.com");
      expect(result.otpauthUrl).toContain(`secret=${result.secret}`);
    });

    it("generates and verifies 6-digit TOTP code accurately", () => {
      const secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP"; // standard test secret
      const secretBuffer = base32Decode(secret);
      const step = Math.floor(Date.now() / 1000 / 30);
      const code = generateHotp(secretBuffer, step, 6);

      expect(code).toMatch(/^\d{6}$/);
      const isValid = verifyTotp(code, secret, 1);
      expect(isValid).toBe(true);
    });

    it("rejects invalid or expired TOTP codes", () => {
      const secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
      expect(verifyTotp("000000", secret, 1)).toBe(false);
      expect(verifyTotp("invalid", secret, 1)).toBe(false);
      expect(verifyTotp("", secret, 1)).toBe(false);
    });

    it("generates 8 unique backup codes in xxxx-xxxx format", () => {
      const codes = generateBackupCodes(8);
      expect(codes.length).toBe(8);
      for (const code of codes) {
        expect(code).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
      }
      const unique = new Set(codes);
      expect(unique.size).toBe(8);
    });

    it("hashes backup codes with SHA-256 reliably", () => {
      const hash1 = hashBackupCode("ABCD-1234");
      const hash2 = hashBackupCode("abcd1234");
      expect(hash1).toBe(hash2);
    });
  });

  // ==========================================
  // 2. USER SETTINGS
  // ==========================================
  describe("User Settings (getMySettings & updateMySettings)", () => {
    it("returns default settings if userSetting row does not exist", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        twoFactorEnabled: false,
      } as any);
      vi.mocked(prisma.userSetting.findUnique).mockResolvedValueOnce(null);

      const res = await getMySettings(mockCtx as any);
      expect(res.language).toBe("en");
      expect(res.theme).toBe("SYSTEM");
      expect(res.timezone).toBe("UTC");
      expect(res.twoFactorEnabled).toBe(false);
    });

    it("returns persisted user settings when found", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        twoFactorEnabled: true,
      } as any);
      vi.mocked(prisma.userSetting.findUnique).mockResolvedValueOnce({
        id: "setting-1",
        userId: "user-123",
        language: "es",
        theme: "DARK",
        timezone: "America/New_York",
        notificationPrefs: {
          ASSIGNMENT: { email: true, push: false },
        },
      } as any);

      const res = await getMySettings(mockCtx as any);
      expect(res.language).toBe("es");
      expect(res.theme).toBe("DARK");
      expect(res.timezone).toBe("America/New_York");
      expect(res.twoFactorEnabled).toBe(true);
      expect(res.notificationPrefs.ASSIGNMENT.email).toBe(true);
    });

    it("upserts user settings and writes audit log", async () => {
      vi.mocked(prisma.userSetting.findUnique).mockResolvedValueOnce({
        id: "setting-1",
        notificationPrefs: {
          EXAM: { email: true },
        },
      } as any);

      vi.mocked(prisma.userSetting.upsert).mockResolvedValueOnce({
        id: "setting-1",
        userId: "user-123",
        language: "fr",
        theme: "LIGHT",
        timezone: "Europe/Paris",
        notificationPrefs: {
          EXAM: { email: true },
          ASSIGNMENT: { email: true, inApp: true },
        },
      } as any);

      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        twoFactorEnabled: false,
      } as any);

      const res = await updateMySettings(mockCtx as any, {
        language: "fr",
        theme: "LIGHT",
        timezone: "Europe/Paris",
        notificationPrefs: {
          ASSIGNMENT: { email: true, inApp: true },
        },
      });

      expect(res.language).toBe("fr");
      expect(res.theme).toBe("LIGHT");
      expect(res.notificationPrefs.ASSIGNMENT.inApp).toBe(true);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "USER_SETTINGS_UPDATE",
            entityType: "UserSetting",
          }),
        }),
      );
    });
  });

  // ==========================================
  // 3. CHANGE PASSWORD
  // ==========================================
  describe("Change Password", () => {
    it("rejects when current password does not match", async () => {
      const hashedOld = await cryptoHelper.hashPassword("CorrectPass123");
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        passwordHash: hashedOld,
      } as any);

      await expect(
        changePassword(mockCtx as any, {
          oldPassword: "WrongPassword!",
          newPassword: "NewSecretPassword123",
        }),
      ).rejects.toThrow("Incorrect current password");

      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "AUTH_CHANGE_PASSWORD_FAILURE",
          }),
        }),
      );
    });

    it("updates password hash and writes audit log on success", async () => {
      const hashedOld = await cryptoHelper.hashPassword("OldPassword123");
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        passwordHash: hashedOld,
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const res = await changePassword(mockCtx as any, {
        oldPassword: "OldPassword123",
        newPassword: "BrandNewPassword456",
      });

      expect(res.message).toBe("Password changed successfully");
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "AUTH_CHANGE_PASSWORD",
          }),
        }),
      );
    });
  });

  // ==========================================
  // 4. TWO-FACTOR AUTHENTICATION (TOTP)
  // ==========================================
  describe("Two-Factor Authentication (enable2FA, verify2FA, disable2FA)", () => {
    it("initiates 2FA setup and caches pending secret", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        email: "student@school.com",
        twoFactorEnabled: false,
      } as any);

      const res = await enable2FA(mockCtx as any);
      expect(res.secret).toBeDefined();
      expect(res.otpauthUrl).toContain("student%40school.com");
      expect(res.backupCodes.length).toBe(8);
      expect(cacheHelper.set).toHaveBeenCalledWith(
        "2fa:pending:user-123",
        expect.objectContaining({ secret: res.secret }),
        600,
      );
    });

    it("throws 400 if 2FA is already enabled on enable2FA", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        twoFactorEnabled: true,
      } as any);

      await expect(enable2FA(mockCtx as any)).rejects.toThrow(
        "Two-factor authentication is already enabled",
      );
    });

    it("verifies TOTP code and commits 2FA to user account", async () => {
      const secret = "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP";
      const backupCodes = ["AAAA-1111", "BBBB-2222"];
      vi.mocked(cacheHelper.get).mockResolvedValueOnce({
        secret,
        backupCodes,
      });
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const step = Math.floor(Date.now() / 1000 / 30);
      const token = generateHotp(base32Decode(secret), step, 6);

      const res = await verify2FA(mockCtx as any, { token });
      expect(res.message).toContain("successfully enabled");
      expect(res.backupCodes).toEqual(backupCodes);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-123" },
          data: expect.objectContaining({
            twoFactorEnabled: true,
            twoFactorSecret: secret,
          }),
        }),
      );
      expect(cacheHelper.del).toHaveBeenCalledWith("2fa:pending:user-123");
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "AUTH_2FA_ENABLED",
          }),
        }),
      );
    });

    it("rejects verify2FA with invalid token", async () => {
      vi.mocked(cacheHelper.get).mockResolvedValueOnce({
        secret: "JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP",
        backupCodes: [],
      });

      await expect(verify2FA(mockCtx as any, { token: "999999" })).rejects.toThrow(
        "Invalid authentication code",
      );
    });

    it("disables 2FA with valid password and writes audit log", async () => {
      const hashedPass = await cryptoHelper.hashPassword("MyPassword123");
      vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
        id: "user-123",
        passwordHash: hashedPass,
        twoFactorEnabled: true,
      } as any);
      vi.mocked(prisma.user.update).mockResolvedValueOnce({} as any);

      const res = await disable2FA(mockCtx as any, { password: "MyPassword123" });
      expect(res.message).toContain("disabled");
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorBackupCodes: [],
          },
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "AUTH_2FA_DISABLED",
          }),
        }),
      );
    });
  });

  // ==========================================
  // 5. SESSION MANAGEMENT
  // ==========================================
  describe("Sessions (listMySessions & revokeSession)", () => {
    it("lists active sessions and accurately marks current session", async () => {
      vi.mocked(prisma.userSession.findMany).mockResolvedValueOnce([
        {
          id: "session-1",
          ipAddress: "192.168.1.1",
          userAgent: "Chrome",
          token: "jwt-token-current",
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
        {
          id: "session-2",
          ipAddress: "10.0.0.1",
          userAgent: "Safari",
          token: "jwt-token-other",
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
      ] as any);

      const sessions = await listMySessions(mockCtx as any, "jwt-token-current");
      expect(sessions.length).toBe(2);
      expect(sessions[0].id).toBe("session-1");
      expect(sessions[0].isCurrent).toBe(true);
      expect(sessions[1].isCurrent).toBe(false);
    });

    it("auto-registers current session if no records exist", async () => {
      vi.mocked(prisma.userSession.findMany).mockResolvedValueOnce([]);
      vi.mocked(prisma.userSession.create).mockResolvedValueOnce({
        id: "auto-session-1",
        ipAddress: mockCtx.ipAddress,
        userAgent: mockCtx.userAgent,
        createdAt: new Date(),
        lastActiveAt: new Date(),
      } as any);

      const sessions = await listMySessions(mockCtx as any, "dummy-token");
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe("auto-session-1");
      expect(sessions[0].isCurrent).toBe(true);
    });

    it("revokes session, blacklists token, and writes audit log", async () => {
      vi.mocked(prisma.userSession.findFirst).mockResolvedValueOnce({
        id: "session-to-revoke",
        userId: "user-123",
        token: "token-to-blacklist",
        isRevoked: false,
      } as any);
      vi.mocked(prisma.userSession.update).mockResolvedValueOnce({} as any);

      const res = await revokeSession(mockCtx as any, "session-to-revoke");
      expect(res.message).toBe("Session revoked successfully");
      expect(prisma.userSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "session-to-revoke" },
          data: { isRevoked: true },
        }),
      );
      expect(cacheHelper.blacklistToken).toHaveBeenCalledWith("token-to-blacklist", 86400);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "AUTH_SESSION_REVOKED",
          }),
        }),
      );
    });
  });

  // ==========================================
  // 6. INSTITUTE SETTINGS (5 SECTIONS)
  // ==========================================
  describe("Institute Settings (get & update per section)", () => {
    it("retrieves synthesized institute settings with defaults", async () => {
      vi.mocked(prisma.instituteSetting.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.instituteSupportSetting.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.institutePublicProfile.findUnique).mockResolvedValueOnce(null);

      const res = await getInstituteSettings("inst-123");
      expect(res.instituteId).toBe("inst-123");
      expect(res.attendance.mode).toBe("DAILY");
      expect(res.grading.scaleType).toBe("GPA_4");
      expect(res.support.defaultProvider).toBe("GOOGLE_MEET");
      expect(res.branding.portalTheme).toBe("AUTO");
      expect(res.visibility.phone).toBe("MEMBERS");
    });

    it("validates and updates multiple sections with Zod enforcement", async () => {
      vi.mocked(prisma.instituteSetting.findUnique).mockResolvedValueOnce({
        id: "is-1",
        instituteId: "inst-123",
        attendanceSettings: { mode: "DAILY" },
      } as any);

      vi.mocked(prisma.instituteSetting.upsert).mockResolvedValueOnce({
        id: "is-1",
        instituteId: "inst-123",
      } as any);

      vi.mocked(prisma.instituteSupportSetting.upsert).mockResolvedValueOnce({} as any);
      vi.mocked(prisma.institutePublicProfile.upsert).mockResolvedValueOnce({} as any);

      // Subsequent getInstituteSettings query
      vi.mocked(prisma.instituteSetting.findUnique).mockResolvedValueOnce({
        id: "is-1",
        instituteId: "inst-123",
        attendanceSettings: { mode: "SUBJECT_WISE", minimumAttendancePercentage: 80 },
        gradingSettings: { scaleType: "PERCENTAGE", passThresholdPercentage: 50 },
        brandingSettings: { primaryColor: "#4f46e5" },
        supportSettings: { isOpen: true, timezone: "America/Chicago" },
        visibilitySettings: { phone: "PUBLIC" },
      } as any);

      const res = await updateInstituteSettings(mockCtx as any, {
        attendance: {
          mode: "SUBJECT_WISE",
          minimumAttendancePercentage: 80,
        },
        grading: {
          scaleType: "PERCENTAGE",
          passThresholdPercentage: 50,
        },
        branding: {
          primaryColor: "#4f46e5",
        },
        support: {
          isOpen: true,
          timezone: "America/Chicago",
        },
        visibility: {
          phone: "PUBLIC",
        },
      });

      expect(res.attendance.mode).toBe("SUBJECT_WISE");
      expect(res.grading.scaleType).toBe("PERCENTAGE");
      expect(res.branding.primaryColor).toBe("#4f46e5");
      expect(prisma.instituteSupportSetting.upsert).toHaveBeenCalled();
      expect(prisma.institutePublicProfile.upsert).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "INSTITUTE_SETTINGS_UPDATE",
          }),
        }),
      );
    });

    it("gets and updates a single section via section helper", async () => {
      vi.mocked(prisma.instituteSetting.findUnique).mockResolvedValue({
        id: "is-1",
        instituteId: "inst-123",
        brandingSettings: { primaryColor: "#10b981", tagline: "Excellence in Learning" },
      } as any);

      const branding = await getInstituteSectionSettings("inst-123", "branding");
      expect(branding.primaryColor).toBe("#10b981");
      expect(branding.tagline).toBe("Excellence in Learning");
    });

    it("strictly rejects invalid section values with Zod", async () => {
      // Invalid hex color
      expect(() =>
        brandingSettingsZodSchema.parse({
          primaryColor: "not-a-color",
        }),
      ).toThrow();

      // Attendance percentage out of bounds
      expect(() =>
        attendanceSettingsZodSchema.parse({
          minimumAttendancePercentage: 150,
        }),
      ).toThrow();

      // Invalid visibility level
      expect(() =>
        visibilitySettingsZodSchema.parse({
          phone: "INVALID_VISIBILITY",
        }),
      ).toThrow();

      // Empty update rejected
      expect(() =>
        updateInstituteSettingsZodSchema.parse({
          body: {},
        }),
      ).toThrow("At least one settings section");
    });
  });
});
