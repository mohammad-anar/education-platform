import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import PlatformAdminValidation from "../../../modules/platform-admin/platform-admin.validation.js";

const PlatformKpisSchema = z.object({
  totalTenants: z.number().int().openapi({ example: 45 }),
  activeTenants: z.number().int().openapi({ example: 42 }),
  suspendedTenants: z.number().int().openapi({ example: 3 }),
  totalUsers: z.number().int().openapi({ example: 125000 }),
  totalStudents: z.number().int().openapi({ example: 118000 }),
  monthlyRecurringRevenueBDT: z.number().openapi({ example: 2450000 }),
  annualRecurringRevenueBDT: z.number().openapi({ example: 29400000 }),
  churnRatePercent: z.number().openapi({ example: 1.8 }),
});

const TenantUsageSchema = z.object({
  instituteId: z.string().openapi({ example: "cly01inst_dhaka2026" }),
  instituteName: z.string().openapi({ example: "Dhaka Residential Model College" }),
  currentStudents: z.number().int().openapi({ example: 2850 }),
  studentLimit: z.number().int().openapi({ example: 3000 }),
  currentTeachers: z.number().int().openapi({ example: 140 }),
  teacherLimit: z.number().int().openapi({ example: 150 }),
  storageUsedBytes: z.string().openapi({ example: "38562145890" }),
  storageLimitBytes: z.string().openapi({ example: "53687091200" }),
});

const AuditLogSchema = z.object({
  id: z.string().openapi({ example: "cly01aud_action_123" }),
  action: z.string().openapi({ example: "TENANT_PLAN_CHANGED" }),
  actorId: z.string().openapi({ example: "cly01usr_superadmin" }),
  instituteId: z.string().nullable().optional().openapi({ example: "cly01inst_dhaka2026" }),
  details: z.record(z.string(), z.any()).openapi({
    example: { previousPlan: "PRO", newPlan: "ENTERPRISE", reason: "Annual renewal upgrade" },
  }),
  ipAddress: z.string().openapi({ example: "103.145.120.45" }),
  createdAt: z.string().openapi({ example: "2026-10-18T05:00:00.000Z" }),
});

// 1. Business KPIs
registerRoute({
  method: "get",
  path: "/api/v1/platform-admin/kpis",
  tag: "Platform Admin",
  summary: "Master platform metrics: MRR, ARR, active tenants, churn rate",
  permission: "platform.admin.read",
  scope: "ALL",
  operationId: "platformAdminGetKpis",
  responses: {
    200: {
      description: "Platform executive business KPIs",
      content: {
        "application/json": {
          schema: successResponse(PlatformKpisSchema, "Platform KPIs retrieved"),
        },
      },
    },
  },
});

// 2. Tenants Listing
registerRoute({
  method: "get",
  path: "/api/v1/platform-admin/tenants",
  tag: "Platform Admin",
  summary: "List all multi-tenant institutes across the system",
  permission: "platform.admin.read",
  scope: "ALL",
  operationId: "platformAdminListTenants",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      limit: z.string().optional().openapi({ example: "10" }),
      status: z.string().optional().openapi({ example: "ACTIVE" }),
    }),
  },
  responses: {
    200: {
      description: "Tenant institutes list",
      content: {
        "application/json": {
          schema: paginated(TenantUsageSchema, "Tenants retrieved"),
        },
      },
    },
  },
});

// 3. Impersonate Start
registerRoute({
  method: "post",
  path: "/api/v1/platform-admin/impersonate/start",
  tag: "Platform Admin",
  summary: "Generate scoped impersonation JWT token for tenant troubleshooting",
  permission: "platform.admin.manage",
  scope: "ALL",
  auditLogged: true,
  operationId: "platformAdminImpersonateStart",
  request: {
    body: {
      content: {
        "application/json": {
          schema: PlatformAdminValidation.impersonateStartZodSchema,
          example: {
            userId: "cly01usr_kalam101",
            instituteId: "cly01inst_dhaka2026",
            reason: "Investigating grade override validation issue reported in ticket TICK-2026-0042",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Impersonation session established and token returned",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              impersonationToken: z.string().openapi({ example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }),
              originalUserId: z.string().openapi({ example: "cly01usr_superadmin" }),
              impersonatedUserId: z.string().openapi({ example: "cly01usr_kalam101" }),
              expiresIn: z.string().openapi({ example: "1h" }),
            }),
            "Impersonation token issued"
          ),
        },
      },
    },
  },
});

// 4. Impersonate End
registerRoute({
  method: "post",
  path: "/api/v1/platform-admin/impersonate/end",
  tag: "Platform Admin",
  summary: "Terminate active impersonation session and resume super-admin context",
  permission: "platform.admin.manage",
  scope: "ALL",
  auditLogged: true,
  operationId: "platformAdminImpersonateEnd",
  responses: {
    200: {
      description: "Impersonation ended successfully",
      content: {
        "application/json": {
          schema: successResponse(z.object({ success: z.boolean() }), "Impersonation ended"),
        },
      },
    },
  },
});

// 5. System Audit Trail
registerRoute({
  method: "get",
  path: "/api/v1/platform-admin/audit-logs",
  tag: "Platform Admin",
  summary: "Comprehensive cross-tenant audit log query ledger",
  permission: "platform.admin.read",
  scope: "ALL",
  operationId: "platformAdminListAuditLogs",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      limit: z.string().optional().openapi({ example: "20" }),
      action: z.string().optional().openapi({ example: "TENANT_PLAN_CHANGED" }),
    }),
  },
  responses: {
    200: {
      description: "Immutable audit log records",
      content: {
        "application/json": {
          schema: paginated(AuditLogSchema, "Audit logs retrieved"),
        },
      },
    },
  },
});
