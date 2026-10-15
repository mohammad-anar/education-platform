import { z } from "zod";

const createZodSchema = z.object({
  body: z.record(z.string(), z.any()),
});

const updateZodSchema = z.object({
  body: z.record(z.string(), z.any()),
});

const assignRoleZodSchema = z.object({
  body: z.object({
    roleId: z.string().uuid("Invalid roleId format"),
  }),
});

const grantOverrideZodSchema = z.object({
  body: z.object({
    permissionCode: z.string().min(1, "Permission code is required"),
    effect: z.enum(["GRANT", "DENY"]),
    scope: z.enum(["OWN", "ASSIGNED", "INSTITUTE", "ALL"]).optional().default("OWN"),
    expiresAt: z.string().datetime().optional().nullable(),
    reason: z.string().optional(),
  }),
});

export const UserValidation = {
  createZodSchema,
  updateZodSchema,
  assignRoleZodSchema,
  grantOverrideZodSchema,
};

export default UserValidation;
