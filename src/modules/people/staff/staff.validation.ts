import { z } from "zod";

const selfUpdateZodSchema = z
  .object({
    phone: z.string().max(30).optional().nullable(),
    address: z.record(z.string(), z.any()).optional().nullable(),
    emergencyContact: z.record(z.string(), z.any()).optional().nullable(),
    acceptsSupportSessions: z.boolean().optional(),
    defaultMeetingUrl: z.string().url().optional().nullable(),
    visibility: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

const adminUpdateZodSchema = z.object({
  employeeCode: z.string().min(1).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  designationId: z.string().uuid().optional().nullable(),
  staffType: z
    .enum([
      "ADMIN",
      "ACCOUNTANT",
      "LIBRARIAN",
      "SUPPORT",
      "SECURITY",
      "IT_ADMIN",
      "ADMISSION_OFFICER",
      "MAINTENANCE",
      "OTHER",
    ])
    .optional(),
  joiningDate: z.string().datetime().optional().nullable(),
  leavingDate: z.string().datetime().optional().nullable(),
  employmentStatus: z
    .enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED", "RETIRED"])
    .optional(),
  phone: z.string().max(30).optional().nullable(),
  address: z.record(z.string(), z.any()).optional().nullable(),
  emergencyContact: z.record(z.string(), z.any()).optional().nullable(),
  acceptsSupportSessions: z.boolean().optional(),
  defaultMeetingUrl: z.string().url().optional().nullable(),
  visibility: z.record(z.string(), z.any()).optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

const uploadPhotoZodSchema = z.object({
  fileAssetId: z.string().uuid("Invalid fileAssetId format"),
});

const addDocumentZodSchema = z.object({
  title: z.string().min(1, "Title is required"),
  documentType: z.string().optional().nullable(),
  fileAssetId: z.string().uuid("Invalid fileAssetId format").optional().nullable(),
  metadata: z.record(z.string(), z.any()).optional().nullable(),
});

const updateVisibilityZodSchema = z.object({
  visibility: z.record(z.string(), z.any()),
});

const updateNotificationPrefsZodSchema = z.object({
  notificationPrefs: z.record(z.string(), z.any()),
});

const createZodSchema = z.object({
  userId: z.string().uuid("Invalid userId"),
  employeeCode: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  designationId: z.string().uuid().optional(),
  staffType: z
    .enum([
      "ADMIN",
      "ACCOUNTANT",
      "LIBRARIAN",
      "SUPPORT",
      "SECURITY",
      "IT_ADMIN",
      "ADMISSION_OFFICER",
      "MAINTENANCE",
      "OTHER",
    ])
    .optional(),
  joiningDate: z.string().datetime().optional(),
  employmentStatus: z
    .enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED", "RESIGNED", "RETIRED"])
    .optional(),
});

export const StaffValidation = {
  createZodSchema,
  updateZodSchema: adminUpdateZodSchema,
  selfUpdateZodSchema,
  adminUpdateZodSchema,
  uploadPhotoZodSchema,
  addDocumentZodSchema,
  updateVisibilityZodSchema,
  updateNotificationPrefsZodSchema,
};

export default StaffValidation;
