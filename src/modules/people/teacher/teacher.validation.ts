import { z } from "zod";

const selfUpdateZodSchema = z
  .object({
    bio: z.string().max(1000).optional().nullable(),
    headline: z.string().max(200).optional().nullable(),
    languages: z.array(z.string()).optional(),
    officePhone: z.string().max(30).optional().nullable(),
    publicEmail: z.string().email().optional().nullable(),
    officeRoom: z.string().max(50).optional().nullable(),
    officeHours: z.record(z.string(), z.any()).optional().nullable(),
    socialLinks: z.record(z.string(), z.any()).optional().nullable(),
    nationalId: z.string().max(50).optional().nullable(),
    address: z.record(z.string(), z.any()).optional().nullable(),
    acceptsSupportSessions: z.boolean().optional(),
    defaultMeetingUrl: z.string().url().optional().nullable(),
    language: z.string().max(50).optional().nullable(),
    qualification: z.string().max(200).optional().nullable(),
    specialization: z.string().max(200).optional().nullable(),
    notificationPrefs: z.record(z.string(), z.any()).optional().nullable(),
    visibility: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

const adminUpdateZodSchema = z.object({
  employeeCode: z.string().min(1).optional(),
  designation: z.string().optional().nullable(),
  qualification: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  experienceYears: z.number().int().min(0).optional().nullable(),
  joiningDate: z.string().datetime().optional().nullable(),
  leavingDate: z.string().datetime().optional().nullable(),
  employmentStatus: z
    .enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED", "RETIRED"])
    .optional(),
  bio: z.string().max(1000).optional().nullable(),
  headline: z.string().max(200).optional().nullable(),
  languages: z.array(z.string()).optional(),
  officePhone: z.string().max(30).optional().nullable(),
  publicEmail: z.string().email().optional().nullable(),
  officeRoom: z.string().max(50).optional().nullable(),
  officeHours: z.record(z.string(), z.any()).optional().nullable(),
  socialLinks: z.record(z.string(), z.any()).optional().nullable(),
  nationalId: z.string().max(50).optional().nullable(),
  address: z.record(z.string(), z.any()).optional().nullable(),
  acceptsSupportSessions: z.boolean().optional(),
  defaultMeetingUrl: z.string().url().optional().nullable(),
  language: z.string().max(50).optional().nullable(),
  notificationPrefs: z.record(z.string(), z.any()).optional().nullable(),
  visibility: z.record(z.string(), z.any()).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

const uploadPhotoZodSchema = z.object({
  fileAssetId: z.string().uuid("Invalid fileAssetId format"),
});

const addQualificationZodSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  fieldOfStudy: z.string().optional().nullable(),
  institution: z.string().min(1, "Institution is required"),
  passingYear: z.number().int().min(1950).max(2100).optional().nullable(),
  grade: z.string().optional().nullable(),
  fileAssetId: z.string().uuid("Invalid fileAssetId format").optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

const updateNotificationPrefsZodSchema = z.object({
  notificationPrefs: z.record(z.string(), z.any()),
});

const updateVisibilityZodSchema = z.object({
  visibility: z.record(z.string(), z.any()),
});

const createZodSchema = z.object({
  userId: z.string().uuid("Invalid userId"),
  employeeCode: z.string().optional(),
  designation: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experienceYears: z.number().int().optional(),
  joiningDate: z.string().datetime().optional(),
  employmentStatus: z
    .enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED", "RETIRED"])
    .optional(),
});

export const TeacherValidation = {
  createZodSchema,
  updateZodSchema: adminUpdateZodSchema,
  selfUpdateZodSchema,
  adminUpdateZodSchema,
  uploadPhotoZodSchema,
  addQualificationZodSchema,
  updateNotificationPrefsZodSchema,
  updateVisibilityZodSchema,
};

export default TeacherValidation;
