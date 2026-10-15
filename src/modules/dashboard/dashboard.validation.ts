import { z } from "zod";

export const teacherFilterQueryZodSchema = z.object({
  query: z.object({
    classGroupId: z.string().uuid("Invalid classGroupId format").optional(),
    courseId: z.string().uuid("Invalid courseId format").optional(),
    days: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

export const adminFilterQueryZodSchema = z.object({
  query: z.object({
    period: z.enum(["month", "year", "quarter"]).optional(),
    days: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    academicYearId: z.string().uuid("Invalid academicYearId format").optional(),
  }),
});

export const guardianFilterQueryZodSchema = z.object({
  query: z.object({
    childId: z.string().uuid("Invalid childId format").optional(),
    days: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
  }),
});

export const childIdParamZodSchema = z.object({
  params: z.object({
    childId: z.string().uuid("Invalid childId UUID parameter"),
  }),
});

export const DashboardValidation = {
  teacherFilterQueryZodSchema,
  adminFilterQueryZodSchema,
  guardianFilterQueryZodSchema,
  childIdParamZodSchema,
};

export default DashboardValidation;
