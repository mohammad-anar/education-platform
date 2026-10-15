import { z } from "zod";

export const tenantFilterQueryZodSchema = z.object({
  query: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
    planCode: z.string().optional(),
    subscriptionStatus: z
      .enum(["TRIAL", "ACTIVE", "PAST_DUE", "EXPIRED", "SUSPENDED", "CANCELLED"])
      .optional(),
    search: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

export const tenantIdParamZodSchema = z.object({
  params: z.object({
    tenantId: z.string().uuid("Invalid tenantId UUID"),
  }),
});

export const suspendTenantZodSchema = z.object({
  params: z.object({
    tenantId: z.string().uuid("Invalid tenantId UUID"),
  }),
  body: z.object({
    reason: z.string().min(3, "Suspension reason must be at least 3 characters long"),
  }),
});

export const changePlanZodSchema = z.object({
  params: z.object({
    tenantId: z.string().uuid("Invalid tenantId UUID"),
  }),
  body: z.object({
    planId: z.string().uuid("Invalid planId UUID"),
    billingCycle: z.enum(["MONTHLY", "QUARTERLY", "YEARLY", "LIFETIME"]),
  }),
});

export const impersonateStartZodSchema = z.object({
  body: z.object({
    tenantId: z.string().uuid("Invalid tenantId UUID"),
    userId: z.string().uuid("Invalid userId UUID"),
    reason: z.string().min(5, "A justification reason of at least 5 characters is required"),
    ttlSeconds: z.number().int().min(60).max(7200).optional(),
  }),
});

export const impersonateEndZodSchema = z.object({
  body: z.object({
    impersonationToken: z.string().min(10, "Valid impersonationToken is required"),
  }),
});

export const upcomingRenewalsQueryZodSchema = z.object({
  query: z.object({
    days: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

export const auditLogFilterQueryZodSchema = z.object({
  query: z.object({
    tenantId: z.string().uuid().optional(),
    userId: z.string().uuid().optional(),
    action: z.string().optional(),
    entityType: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    cursor: z.string().uuid().optional(),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

export const PlatformAdminValidation = {
  tenantFilterQueryZodSchema,
  tenantIdParamZodSchema,
  suspendTenantZodSchema,
  changePlanZodSchema,
  impersonateStartZodSchema,
  impersonateEndZodSchema,
  upcomingRenewalsQueryZodSchema,
  auditLogFilterQueryZodSchema,
};

export default PlatformAdminValidation;
