import { z } from "zod";

const getAttendanceHistoryQueryZodSchema = z
  .object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    subjectId: z.string().uuid().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  })
  .strict();

const getAttendanceCalendarQueryZodSchema = z
  .object({
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month format must be YYYY-MM")
      .optional(),
  })
  .strict();

const getSubjectAttendanceSummaryQueryZodSchema = z
  .object({
    academicYearId: z.string().uuid().optional(),
  })
  .strict();

const getUpcomingItemsQueryZodSchema = z
  .object({
    days: z.coerce.number().int().min(1).max(90).optional(),
  })
  .strict();

const getStudyActivityQueryZodSchema = z
  .object({
    weeks: z.coerce.number().int().min(1).max(52).optional(),
  })
  .strict();

export const StudentPortalValidation = {
  getAttendanceHistoryQueryZodSchema,
  getAttendanceCalendarQueryZodSchema,
  getSubjectAttendanceSummaryQueryZodSchema,
  getUpcomingItemsQueryZodSchema,
  getStudyActivityQueryZodSchema,
};

export default StudentPortalValidation;
