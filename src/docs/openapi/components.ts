import { z } from "zod";
import { registry } from "./registry.js";
import {
  RecordStatus,
  UserStatus,
  MembershipStatus,
  Gender,
  EmploymentStatus,
  EnrollmentStatus,
  PermissionScope,
  OverrideEffect,
  StaffType,
  Visibility,
  CourseStatus,
  LessonType,
  AssessmentType,
  AssessmentStatus,
  ResultStatus,
  AttendanceStatus,
  NoticeCategory,
  NoticeAudienceType,
  TicketStatus,
  TicketPriority,
  SlotStatus,
  SupportSessionStatus,
  SubscriptionStatus,
} from "@prisma/client";

// -----------------------------------------------------------------------
// 1. Security Schemes
// -----------------------------------------------------------------------
export const bearerAuth = registry.registerComponent(
  "securitySchemes",
  "bearerAuth",
  {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description: "JWT Bearer Access Token. Format: Bearer <token>. Auto-captured on POST /api/v1/auth/login.",
  }
);

export const tenantAuth = registry.registerComponent(
  "securitySchemes",
  "tenantAuth",
  {
    type: "apiKey",
    in: "header",
    name: "X-Institute-Id",
    description:
      "Active Multi-tenant Institute Context ID (e.g. 8f047731-26b7-43ea-92a3-9d0e35e970ab). Automatically attached to all requests.",
  }
);

export const instituteHeader = registry.registerComponent(
  "parameters",
  "X-Institute-Id",
  {
    name: "X-Institute-Id",
    in: "header",
    required: false,
    description:
      "Active Tenant / Institute Selector ID. Verified against user membership server-side.",
    schema: {
      type: "string",
      example: "8f047731-26b7-43ea-92a3-9d0e35e970ab",
    },
  }
);

// -----------------------------------------------------------------------
// 2. Reusable Core Data Schemas
// -----------------------------------------------------------------------
export const ErrorResponseSchema = registry.register(
  "ErrorResponse",
  z.object({
    success: z.literal(false).openapi({ example: false }),
    message: z.string().openapi({ example: "Validation Error" }),
    errorMessages: z.array(
      z.object({
        path: z.union([z.string(), z.number()]).openapi({ example: "email" }),
        message: z.string().openapi({ example: "Invalid email address format" }),
      })
    ),
    stack: z.string().optional(),
  })
);

export const PaginationMetaSchema = registry.register(
  "PaginationMeta",
  z.object({
    page: z.number().int().min(1).default(1).openapi({ example: 1 }),
    limit: z.number().int().min(1).default(10).openapi({ example: 10 }),
    total: z.number().int().nonnegative().openapi({ example: 45 }),
    totalPage: z.number().int().nonnegative().openapi({ example: 5 }),
  })
);

export const CursorPaginationSchema = registry.register(
  "CursorPagination",
  z.object({
    nextCursor: z.string().nullable().optional().openapi({ example: "cly789abc" }),
    hasMore: z.boolean().openapi({ example: true }),
  })
);

export const IdParamSchema = registry.register(
  "IdParam",
  z.object({
    id: z.string().openapi({
      description: "Unique entity UUID or CUID",
      example: "cly01abc2026institute",
    }),
  })
);

// -----------------------------------------------------------------------
// 3. Registered Prisma Enums (Copied directly from @prisma/client)
// -----------------------------------------------------------------------
export const PermissionScopeEnum = registry.register(
  "PermissionScope",
  z.enum(PermissionScope as any)
);
export const EmploymentStatusEnum = registry.register(
  "EmploymentStatus",
  z.enum(EmploymentStatus as any)
);
export const EnrollmentStatusEnum = registry.register(
  "EnrollmentStatus",
  z.enum(EnrollmentStatus as any)
);
export const VisibilityEnum = registry.register(
  "Visibility",
  z.enum(Visibility as any)
);
export const AttendanceStatusEnum = registry.register(
  "AttendanceStatus",
  z.enum(AttendanceStatus as any)
);
export const AssessmentTypeEnum = registry.register(
  "AssessmentType",
  z.enum(AssessmentType as any)
);
export const NoticeCategoryEnum = registry.register(
  "NoticeCategory",
  z.enum(NoticeCategory as any)
);
export const TicketStatusEnum = registry.register(
  "TicketStatus",
  z.enum(TicketStatus as any)
);
export const TicketPriorityEnum = registry.register(
  "TicketPriority",
  z.enum(TicketPriority as any)
);
export const SupportSessionStatusEnum = registry.register(
  "SupportSessionStatus",
  z.enum(SupportSessionStatus as any)
);
export const SubscriptionStatusEnum = registry.register(
  "SubscriptionStatus",
  z.enum(SubscriptionStatus as any)
);

// -----------------------------------------------------------------------
// 4. Reusable Standard HTTP Responses
// -----------------------------------------------------------------------
export const responses = {
  badRequest: registry.registerComponent("responses", "ValidationError", {
    description: "400 - Request payload validation error or malformed body",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  }),
  unauthorized: registry.registerComponent("responses", "Unauthorized", {
    description: "401 - Authentication required. Bearer JWT missing, expired, or invalid.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  }),
  forbidden: registry.registerComponent("responses", "Forbidden", {
    description: "403 - Forbidden. Missing required permission code or inadequate scope.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  }),
  notFound: registry.registerComponent("responses", "NotFound", {
    description: "404 - Requested resource, route or entity was not found.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  }),
  conflict: registry.registerComponent("responses", "Conflict", {
    description: "409 - Conflict. Unique constraint violation or double-booking.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  }),
  rateLimited: registry.registerComponent("responses", "RateLimited", {
    description: "429 - Too Many Requests. Rate limit threshold exceeded.",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  }),
};
