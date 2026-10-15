import { z } from "zod";

const createRoleZodSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    code: z
      .string()
      .min(2, "Code must be at least 2 characters")
      .max(50)
      .regex(/^[A-Z0-9_-]+$/i, "Code must contain only letters, numbers, hyphens, and underscores"),
    description: z.string().optional(),
    cloneFromRoleId: z.string().uuid("Invalid cloneFromRoleId format").optional(),
  }),
});

const updateRoleZodSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    code: z
      .string()
      .min(2)
      .max(50)
      .regex(/^[A-Z0-9_-]+$/i, "Code must contain only letters, numbers, hyphens, and underscores")
      .optional(),
    description: z.string().optional(),
  }),
});

const setRoleMatrixZodSchema = z.object({
  body: z.object({
    permissions: z.array(
      z.object({
        permissionCode: z.string().min(1, "Permission code is required"),
        scope: z.enum(["OWN", "ASSIGNED", "INSTITUTE", "ALL"]).nullable(),
      }),
    ),
  }),
});

const deleteRoleZodSchema = z.object({
  body: z
    .object({
      reassignToRoleId: z.string().uuid("Invalid reassignToRoleId format").optional(),
    })
    .optional(),
  query: z
    .object({
      reassignToRoleId: z.string().uuid("Invalid reassignToRoleId format").optional(),
    })
    .optional(),
});

export const RoleValidation = {
  createZodSchema: createRoleZodSchema,
  updateZodSchema: updateRoleZodSchema,
  setRoleMatrixZodSchema,
  deleteRoleZodSchema,
};

export default RoleValidation;
