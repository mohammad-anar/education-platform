import { z } from "zod";

const selfUpdateZodSchema = z
  .object({
    dateOfBirth: z.string().datetime().optional().nullable(),
    gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional().nullable(),
    bloodGroup: z.string().max(10).optional().nullable(),
    emergencyContactName: z.string().max(100).optional().nullable(),
    emergencyContactPhone: z.string().max(30).optional().nullable(),
    nationality: z.string().max(50).optional().nullable(),
    religion: z.string().max(50).optional().nullable(),
    nationalId: z.string().max(50).optional().nullable(),
    birthCertificateNo: z.string().max(50).optional().nullable(),
    presentAddress: z.record(z.string(), z.any()).optional().nullable(),
    permanentAddress: z.record(z.string(), z.any()).optional().nullable(),
    alternatePhone: z.string().max(30).optional().nullable(),
    previousSchool: z.string().max(150).optional().nullable(),
    fatherName: z.string().max(100).optional().nullable(),
    motherName: z.string().max(100).optional().nullable(),
    allergies: z.string().max(255).optional().nullable(),
    medicalConditions: z.string().max(255).optional().nullable(),
    language: z.string().max(50).optional().nullable(),
    notificationPrefs: z.record(z.string(), z.any()).optional().nullable(),
    visibility: z.record(z.string(), z.any()).optional().nullable(),
  })
  .strict();

const adminUpdateZodSchema = z.object({
  studentCode: z.string().min(1).optional(),
  admissionNo: z.string().optional().nullable(),
  dateOfBirth: z.string().datetime().optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  admissionDate: z.string().datetime().optional().nullable(),
  graduationDate: z.string().datetime().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "DELETED"]).optional(),
  statusReason: z.string().optional().nullable(),
  emergencyContactName: z.string().max(100).optional().nullable(),
  emergencyContactPhone: z.string().max(30).optional().nullable(),
  nationality: z.string().max(50).optional().nullable(),
  religion: z.string().max(50).optional().nullable(),
  nationalId: z.string().max(50).optional().nullable(),
  birthCertificateNo: z.string().max(50).optional().nullable(),
  presentAddress: z.record(z.string(), z.any()).optional().nullable(),
  permanentAddress: z.record(z.string(), z.any()).optional().nullable(),
  alternatePhone: z.string().max(30).optional().nullable(),
  previousSchool: z.string().max(150).optional().nullable(),
  fatherName: z.string().max(100).optional().nullable(),
  motherName: z.string().max(100).optional().nullable(),
  allergies: z.string().max(255).optional().nullable(),
  medicalConditions: z.string().max(255).optional().nullable(),
  language: z.string().max(50).optional().nullable(),
  notificationPrefs: z.record(z.string(), z.any()).optional().nullable(),
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

const updateNotificationPrefsZodSchema = z.object({
  notificationPrefs: z.record(z.string(), z.any()),
});

const updateVisibilityZodSchema = z.object({
  visibility: z.record(z.string(), z.any()),
});

const createZodSchema = z.object({
  userId: z.string().uuid().optional(),
  studentCode: z.string().min(1, "Student code is required"),
  admissionNo: z.string().optional(),
  admissionDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED", "DELETED"]).optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  nationalId: z.string().optional(),
  birthCertificateNo: z.string().optional(),
});

export const StudentValidation = {
  createZodSchema,
  updateZodSchema: adminUpdateZodSchema,
  selfUpdateZodSchema,
  adminUpdateZodSchema,
  uploadPhotoZodSchema,
  addDocumentZodSchema,
  updateNotificationPrefsZodSchema,
  updateVisibilityZodSchema,
};

export default StudentValidation;
