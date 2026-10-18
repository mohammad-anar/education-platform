import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";

const InstituteResponseSchema = z.object({
  id: z.string().openapi({ example: "cly01inst_dhaka2026" }),
  name: z.string().openapi({ example: "Dhaka Residential Model College" }),
  code: z.string().openapi({ example: "DRMC-101" }),
  slug: z.string().openapi({ example: "drmc-dhaka" }),
  domain: z.string().nullable().optional().openapi({ example: "drmc.edu.bd" }),
  email: z.string().openapi({ example: "info@drmc.edu.bd" }),
  phone: z.string().nullable().optional().openapi({ example: "+8801711223344" }),
  status: z.enum(["ACTIVE", "SUSPENDED", "TRIAL", "INACTIVE"]).openapi({ example: "ACTIVE" }),
  studentLimit: z.number().int().openapi({ example: 2500 }),
  teacherLimit: z.number().int().openapi({ example: 120 }),
  storageLimitBytes: z.string().openapi({ example: "53687091200" }),
  createdAt: z.string().openapi({ example: "2026-01-01T00:00:00.000Z" }),
});

const CreateInstituteInputSchema = z.object({
  name: z.string().min(2).openapi({ example: "Dhaka Residential Model College" }),
  code: z.string().min(2).openapi({ example: "DRMC-101" }),
  slug: z.string().min(2).openapi({ example: "drmc-dhaka" }),
  domain: z.string().optional().openapi({ example: "drmc.edu.bd" }),
  email: z.string().email().openapi({ example: "admin@drmc.edu.bd" }),
  phone: z.string().optional().openapi({ example: "+8801711223344" }),
  studentLimit: z.number().int().default(500).openapi({ example: 1000 }),
  teacherLimit: z.number().int().default(50).openapi({ example: 80 }),
});

const UpdateInstituteInputSchema = CreateInstituteInputSchema.partial();

const SubscriptionResponseSchema = z.object({
  id: z.string().openapi({ example: "cly01sub_enterprise2026" }),
  instituteId: z.string().openapi({ example: "cly01inst_dhaka2026" }),
  plan: z.enum(["FREE_TRIAL", "BASIC", "PRO", "ENTERPRISE"]).openapi({ example: "PRO" }),
  status: z.enum(["ACTIVE", "TRIAL", "PAST_DUE", "CANCELLED"]).openapi({ example: "ACTIVE" }),
  billingCycle: z.enum(["MONTHLY", "YEARLY"]).openapi({ example: "YEARLY" }),
  priceAmountBDT: z.number().openapi({ example: 120000 }),
  startDate: z.string().openapi({ example: "2026-01-01T00:00:00.000Z" }),
  endDate: z.string().openapi({ example: "2027-01-01T00:00:00.000Z" }),
});

// 1. GET /api/v1/saas/institutes
registerRoute({
  method: "get",
  path: "/api/v1/saas/institutes",
  tag: "SaaS",
  summary: "List all tenant institutes",
  permission: "saas.institute.read",
  scope: "ALL",
  operationId: "saasInstitutesList",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      limit: z.string().optional().openapi({ example: "10" }),
      searchTerm: z.string().optional().openapi({ example: "Dhaka" }),
    }),
  },
  responses: {
    200: {
      description: "List of registered institutes with pagination",
      content: {
        "application/json": {
          schema: paginated(InstituteResponseSchema, "Institutes retrieved successfully"),
        },
      },
    },
  },
});

// 2. POST /api/v1/saas/institutes
registerRoute({
  method: "post",
  path: "/api/v1/saas/institutes",
  tag: "SaaS",
  summary: "Create and onboard a new tenant institute",
  permission: "saas.institute.create",
  scope: "ALL",
  auditLogged: true,
  operationId: "saasInstitutesCreate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateInstituteInputSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Institute created successfully",
      content: {
        "application/json": {
          schema: successResponse(InstituteResponseSchema, "Institute created successfully"),
        },
      },
    },
  },
});

// 3. GET /api/v1/saas/institutes/:id
registerRoute({
  method: "get",
  path: "/api/v1/saas/institutes/:id",
  tag: "SaaS",
  summary: "Get institute details by ID",
  permission: "saas.institute.read",
  scope: "INSTITUTE",
  operationId: "saasInstitutesGetById",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "cly01inst_dhaka2026" }),
    }),
  },
  responses: {
    200: {
      description: "Institute profile details",
      content: {
        "application/json": {
          schema: successResponse(InstituteResponseSchema, "Institute details"),
        },
      },
    },
  },
});

// 4. PATCH /api/v1/saas/institutes/:id
registerRoute({
  method: "patch",
  path: "/api/v1/saas/institutes/:id",
  tag: "SaaS",
  summary: "Update institute details",
  permission: "saas.institute.update",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "saasInstitutesUpdate",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "cly01inst_dhaka2026" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: UpdateInstituteInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Institute updated successfully",
      content: {
        "application/json": {
          schema: successResponse(InstituteResponseSchema, "Institute updated successfully"),
        },
      },
    },
  },
});

// 5. GET /api/v1/saas/institutes/:id/stats (Deprecated)
registerRoute({
  method: "get",
  path: "/api/v1/saas/institutes/:id/stats",
  tag: "SaaS",
  summary: "Get institute statistics (Deprecated)",
  description: "⚠️ **Deprecated:** Superseded by \`GET /api/v1/dashboard/admin\` which provides rich charts and cached KPIs.",
  deprecated: true,
  permission: "saas.institute.stats",
  scope: "INSTITUTE",
  operationId: "saasInstitutesGetStatsDeprecated",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "cly01inst_dhaka2026" }),
    }),
  },
  responses: {
    200: {
      description: "Institute basic counts",
      content: {
        "application/json": {
          schema: successResponse(z.record(z.string(), z.any()), "Institute stats"),
        },
      },
    },
  },
});

// 6. PATCH /api/v1/saas/institutes/:id/settings
registerRoute({
  method: "patch",
  path: "/api/v1/saas/institutes/:id/settings",
  tag: "SaaS",
  summary: "Update tenant institute settings",
  permission: "saas.institute.settings",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "saasInstitutesUpdateSettings",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "cly01inst_dhaka2026" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            themeColor: z.string().optional().openapi({ example: "#1e3a8a" }),
            allowOnlineAdmission: z.boolean().optional().openapi({ example: true }),
            timezone: z.string().optional().openapi({ example: "Asia/Dhaka" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Settings updated",
      content: {
        "application/json": {
          schema: successResponse(z.record(z.string(), z.any()), "Settings updated successfully"),
        },
      },
    },
  },
});

// 7. POST /api/v1/saas/institutes/:id/suspend
registerRoute({
  method: "post",
  path: "/api/v1/saas/institutes/:id/suspend",
  tag: "SaaS",
  summary: "Suspend tenant institute",
  permission: "saas.institute.suspend",
  scope: "ALL",
  auditLogged: true,
  operationId: "saasInstitutesSuspend",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "cly01inst_dhaka2026" }),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            reason: z.string().min(5).openapi({ example: "Subscription payment overdue beyond grace period" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Institute suspended",
      content: {
        "application/json": {
          schema: successResponse(z.object({ suspended: z.boolean() }), "Institute suspended successfully"),
        },
      },
    },
  },
});

// 8. DELETE /api/v1/saas/institutes/:id
registerRoute({
  method: "delete",
  path: "/api/v1/saas/institutes/:id",
  tag: "SaaS",
  summary: "Soft delete institute",
  permission: "saas.institute.delete",
  scope: "ALL",
  auditLogged: true,
  operationId: "saasInstitutesDelete",
  request: {
    params: z.object({
      id: z.string().openapi({ example: "cly01inst_dhaka2026" }),
    }),
  },
  responses: {
    200: {
      description: "Institute deleted",
      content: {
        "application/json": {
          schema: successResponse(z.object({ deleted: z.boolean() }), "Institute deleted successfully"),
        },
      },
    },
  },
});

// Subscriptions
registerRoute({
  method: "get",
  path: "/api/v1/saas/subscriptions",
  tag: "SaaS",
  summary: "List all subscriptions",
  permission: "saas.subscription.read",
  scope: "ALL",
  operationId: "saasSubscriptionsList",
  responses: {
    200: {
      description: "List of subscriptions",
      content: {
        "application/json": {
          schema: paginated(SubscriptionResponseSchema, "Subscriptions retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/saas/subscriptions",
  tag: "SaaS",
  summary: "Create tenant subscription",
  permission: "saas.subscription.create",
  scope: "ALL",
  auditLogged: true,
  operationId: "saasSubscriptionsCreate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            instituteId: z.string().openapi({ example: "cly01inst_dhaka2026" }),
            plan: z.enum(["BASIC", "PRO", "ENTERPRISE"]).openapi({ example: "PRO" }),
            billingCycle: z.enum(["MONTHLY", "YEARLY"]).openapi({ example: "YEARLY" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: "Subscription created",
      content: {
        "application/json": {
          schema: successResponse(SubscriptionResponseSchema, "Subscription created"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/saas/subscriptions/:id",
  tag: "SaaS",
  summary: "Get subscription by ID",
  permission: "saas.subscription.read",
  scope: "INSTITUTE",
  operationId: "saasSubscriptionsGetById",
  request: {
    params: z.object({ id: z.string().openapi({ example: "cly01sub_enterprise2026" }) }),
  },
  responses: {
    200: {
      description: "Subscription details",
      content: {
        "application/json": {
          schema: successResponse(SubscriptionResponseSchema, "Subscription details"),
        },
      },
    },
  },
});

registerRoute({
  method: "patch",
  path: "/api/v1/saas/subscriptions/:id",
  tag: "SaaS",
  summary: "Update subscription plan",
  permission: "saas.subscription.update",
  scope: "ALL",
  auditLogged: true,
  operationId: "saasSubscriptionsUpdate",
  request: {
    params: z.object({ id: z.string().openapi({ example: "cly01sub_enterprise2026" }) }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            plan: z.enum(["BASIC", "PRO", "ENTERPRISE"]).optional().openapi({ example: "ENTERPRISE" }),
            status: z.enum(["ACTIVE", "CANCELLED", "PAST_DUE"]).optional().openapi({ example: "ACTIVE" }),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Subscription updated",
      content: {
        "application/json": {
          schema: successResponse(SubscriptionResponseSchema, "Subscription updated"),
        },
      },
    },
  },
});

registerRoute({
  method: "delete",
  path: "/api/v1/saas/subscriptions/:id",
  tag: "SaaS",
  summary: "Cancel subscription",
  permission: "saas.subscription.delete",
  scope: "ALL",
  auditLogged: true,
  operationId: "saasSubscriptionsDelete",
  request: {
    params: z.object({ id: z.string().openapi({ example: "cly01sub_enterprise2026" }) }),
  },
  responses: {
    200: {
      description: "Subscription cancelled",
      content: {
        "application/json": {
          schema: successResponse(z.object({ cancelled: z.boolean() }), "Subscription cancelled"),
        },
      },
    },
  },
});
