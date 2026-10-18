import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import { NoticeValidation } from "../../../modules/platform/notice/notice.validation.js";
import { NotificationValidation } from "../../../modules/platform/notification/notification.validation.js";
import { FileValidation } from "../../../modules/platform/file/file.validation.js";
import { CertificateValidation } from "../../../modules/platform/certificate/certificate.validation.js";
import { IdParamSchema } from "../components.js";

const NoticeSchema = z.object({
  id: z.string().openapi({ example: "cly01ntc_puja_vacation" }),
  title: z.string().openapi({ example: "Durga Puja & Autumn Vacation Notice 2026" }),
  content: z.string().openapi({ example: "The college will remain closed from October 20 to October 24 on account of Durga Puja." }),
  category: z.enum(["ACADEMIC", "ADMINISTRATIVE", "EXAM", "HOLIDAY", "EMERGENCY"]).openapi({ example: "HOLIDAY" }),
  audienceType: z.enum(["ALL", "STUDENTS", "TEACHERS", "PARENTS", "STAFF"]).openapi({ example: "ALL" }),
  isPinned: z.boolean().openapi({ example: true }),
  publishedAt: z.string().openapi({ example: "2026-10-15T08:00:00.000Z" }),
});

const NotificationSchema = z.object({
  id: z.string().openapi({ example: "cly01notif_attn_warn" }),
  userId: z.string().openapi({ example: "cly01usr_rahim101" }),
  title: z.string().openapi({ example: "Attendance Alert" }),
  body: z.string().openapi({ example: "Your attendance in Physics is currently 74.2%, which is below the mandatory 75% threshold." }),
  isRead: z.boolean().openapi({ example: false }),
  createdAt: z.string().openapi({ example: "2026-10-18T07:30:00.000Z" }),
});

const FileAssetSchema = z.object({
  id: z.string().openapi({ example: "cly01fil_syl_physics" }),
  originalName: z.string().openapi({ example: "Physics_Syllabus_2026.pdf" }),
  url: z.string().openapi({ example: "https://cdn.education.bd/uploads/syl_physics_2026.pdf" }),
  fileSize: z.number().int().openapi({ example: 2451000 }),
  mimeType: z.string().openapi({ example: "application/pdf" }),
});

const CertificateSchema = z.object({
  id: z.string().openapi({ example: "cly01crt_hsc_pass" }),
  certificateNumber: z.string().openapi({ example: "CERT-2026-89104" }),
  studentId: z.string().openapi({ example: "cly01std_rahim2026" }),
  title: z.string().openapi({ example: "Certificate of Academic Excellence" }),
  issuedAt: z.string().openapi({ example: "2026-10-01T00:00:00.000Z" }),
  pdfUrl: z.string().openapi({ example: "https://cdn.education.bd/certificates/cert-89104.pdf" }),
});

// 1. Notices
registerRoute({
  method: "get",
  path: "/api/v1/platform/notices/my",
  tag: "Platform",
  summary: "Get targeted notice board feed for authenticated user",
  permission: "platform.notice.read",
  scope: "OWN",
  operationId: "platformGetMyNotices",
  responses: {
    200: {
      description: "Targeted notices list",
      content: {
        "application/json": {
          schema: paginated(NoticeSchema, "Notices feed retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/platform/notices",
  tag: "Platform",
  summary: "Publish new institutional notice board bulletin",
  permission: "platform.notice.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "platformCreateNotice",
  request: {
    body: {
      content: {
        "application/json": {
          schema: NoticeValidation.createZodSchema,
          example: {
            title: "Durga Puja & Autumn Vacation Notice 2026",
            content: "The college will remain closed from October 20 to October 24 on account of Durga Puja.",
            category: "HOLIDAY",
            audienceType: "ALL",
            isPinned: true,
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Notice published (NOTICE_PUBLISHED event queued)",
      content: {
        "application/json": {
          schema: successResponse(NoticeSchema, "Notice published"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/platform/notices/:id/read",
  tag: "Platform",
  summary: "Acknowledge / mark notice as read",
  permission: "platform.notice.read",
  scope: "OWN",
  operationId: "platformMarkNoticeRead",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "Notice read receipt stored",
      content: {
        "application/json": {
          schema: successResponse(z.object({ read: z.boolean() }), "Notice acknowledged"),
        },
      },
    },
  },
});

// 2. Notifications
registerRoute({
  method: "get",
  path: "/api/v1/platform/notifications",
  tag: "Platform",
  summary: "List user in-app notification alerts",
  permission: "platform.notification.read",
  scope: "OWN",
  operationId: "platformListNotifications",
  responses: {
    200: {
      description: "Notifications list",
      content: {
        "application/json": {
          schema: paginated(NotificationSchema, "Notifications retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "patch",
  path: "/api/v1/platform/notifications/:id",
  tag: "Platform",
  summary: "Mark notification as read",
  permission: "platform.notification.update",
  scope: "OWN",
  operationId: "platformUpdateNotification",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: NotificationValidation.updateZodSchema,
          example: { isRead: true },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Notification updated",
      content: {
        "application/json": {
          schema: successResponse(NotificationSchema, "Notification marked read"),
        },
      },
    },
  },
});

// 3. Files
registerRoute({
  method: "get",
  path: "/api/v1/platform/files",
  tag: "Platform",
  summary: "List uploaded media files and documents",
  permission: "platform.file.read",
  scope: "INSTITUTE",
  operationId: "platformListFiles",
  responses: {
    200: {
      description: "Files list",
      content: {
        "application/json": {
          schema: paginated(FileAssetSchema, "Files retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/platform/files",
  tag: "Platform",
  summary: "Upload document or file asset",
  permission: "platform.file.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "platformUploadFile",
  request: {
    body: {
      content: {
        "application/json": {
          schema: FileValidation.createZodSchema,
          example: {
            originalName: "Physics_Syllabus_2026.pdf",
            url: "https://cdn.education.bd/uploads/syl_physics_2026.pdf",
            fileSize: 2451000,
            mimeType: "application/pdf",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "File uploaded successfully",
      content: {
        "application/json": {
          schema: successResponse(FileAssetSchema, "File asset stored"),
        },
      },
    },
  },
});

// 4. Certificates
registerRoute({
  method: "get",
  path: "/api/v1/platform/certificates",
  tag: "Platform",
  summary: "List issued student certificates",
  permission: "platform.certificate.read",
  scope: "INSTITUTE",
  operationId: "platformListCertificates",
  responses: {
    200: {
      description: "Certificates list",
      content: {
        "application/json": {
          schema: paginated(CertificateSchema, "Certificates retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/platform/certificates",
  tag: "Platform",
  summary: "Generate and issue new verified certificate (with QR code)",
  permission: "platform.certificate.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "platformCreateCertificate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CertificateValidation.createZodSchema,
          example: {
            studentId: "cly01std_rahim2026",
            title: "Certificate of Academic Excellence",
            issuedAt: "2026-10-01T00:00:00.000Z",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Certificate generated",
      content: {
        "application/json": {
          schema: successResponse(CertificateSchema, "Certificate generated"),
        },
      },
    },
  },
});
