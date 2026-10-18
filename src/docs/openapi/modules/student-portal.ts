import { z } from "zod";
import { registerRoute, successResponse } from "../helpers.js";
import { StudentPortalValidation } from "../../../modules/student-portal/student-portal.validation.js";

const TodaySummarySchema = z.object({
  date: z.string().openapi({ example: "2026-10-18" }),
  dayOfWeek: z.string().openapi({ example: "SUNDAY" }),
  periods: z.array(
    z.object({
      periodNumber: z.number().int().openapi({ example: 1 }),
      subject: z.string().openapi({ example: "Physics 1st Paper" }),
      teacher: z.string().openapi({ example: "Mohammad Hasan" }),
      startTime: z.string().openapi({ example: "09:00" }),
      endTime: z.string().openapi({ example: "09:45" }),
      roomNumber: z.string().openapi({ example: "Lab-3" }),
      status: z.string().openapi({ example: "SCHEDULED" }),
    })
  ),
  overallAttendancePercentage: z.number().openapi({ example: 82.5 }),
});

const OverdueItemSchema = z.object({
  id: z.string().openapi({ example: "cly01asm_phy_hw2" }),
  title: z.string().openapi({ example: "Physics Chapter 2 Assignment" }),
  type: z.string().openapi({ example: "ASSIGNMENT" }),
  dueDate: z.string().openapi({ example: "2026-10-14T23:59:59.000Z" }),
  daysOverdue: z.number().int().openapi({ example: 4 }),
});

const ContinueLearningSchema = z.object({
  lastCourseId: z.string().openapi({ example: "cly01crs_hsc_phys" }),
  lastCourseTitle: z.string().openapi({ example: "HSC 2026 Complete Physics Masterclass" }),
  lastLessonId: z.string().openapi({ example: "cly01lsn_dot_product" }),
  lastLessonTitle: z.string().openapi({ example: "Lesson 2.1: Dot Product and Applications" }),
  lastPositionSeconds: z.number().openapi({ example: 420 }),
  totalDurationSeconds: z.number().openapi({ example: 2100 }),
  progressPercent: z.number().openapi({ example: 64.5 }),
});

registerRoute({
  method: "get",
  path: "/api/v1/student-portal",
  tag: "Student Portal",
  summary: "Comprehensive aggregated student dashboard",
  permission: "student.portal.view",
  scope: "OWN",
  operationId: "studentPortalGetDashboard",
  responses: {
    200: {
      description: "Aggregated student portal state",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              today: TodaySummarySchema,
              overdue: z.array(OverdueItemSchema),
              continueLearning: ContinueLearningSchema,
            }),
            "Student dashboard retrieved"
          ),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/student-portal/today-summary",
  tag: "Student Portal",
  summary: "Today's class schedule, periods, and routine",
  permission: "student.portal.view",
  scope: "OWN",
  operationId: "studentPortalGetTodaySummary",
  responses: {
    200: {
      description: "Today's academic routine summary",
      content: {
        "application/json": {
          schema: successResponse(TodaySummarySchema, "Today summary retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/student-portal/overdue-items",
  tag: "Student Portal",
  summary: "List pending tasks and overdue homework/assignments",
  permission: "student.portal.view",
  scope: "OWN",
  operationId: "studentPortalGetOverdueItems",
  responses: {
    200: {
      description: "List of overdue items",
      content: {
        "application/json": {
          schema: successResponse(z.array(OverdueItemSchema), "Overdue items retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/student-portal/continue-learning",
  tag: "Student Portal",
  summary: "Resume playback for last active video lecture",
  permission: "student.portal.view",
  scope: "OWN",
  operationId: "studentPortalGetContinueLearning",
  responses: {
    200: {
      description: "Resume video learning coordinates",
      content: {
        "application/json": {
          schema: successResponse(ContinueLearningSchema, "Continue learning data retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/student-portal/attendance/calendar",
  tag: "Student Portal",
  summary: "Monthly student attendance calendar with daily color coding",
  permission: "student.portal.view",
  scope: "OWN",
  operationId: "studentPortalGetAttendanceCalendar",
  request: {
    query: z.object({
      year: z.string().optional().openapi({ example: "2026" }),
      month: z.string().optional().openapi({ example: "10" }),
    }),
  },
  responses: {
    200: {
      description: "Monthly attendance calendar breakdown",
      content: {
        "application/json": {
          schema: successResponse(
            z.array(
              z.object({
                date: z.string().openapi({ example: "2026-10-18" }),
                status: z.enum(["PRESENT", "ABSENT", "LATE", "HOLIDAY", "EXCUSED"]).openapi({ example: "PRESENT" }),
              })
            ),
            "Attendance calendar retrieved"
          ),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/student-portal/performance-trend",
  tag: "Student Portal",
  summary: "Student academic score progression and examination trend chart",
  permission: "student.portal.view",
  scope: "OWN",
  operationId: "studentPortalGetPerformanceTrend",
  responses: {
    200: {
      description: "Historical academic performance progression",
      content: {
        "application/json": {
          schema: successResponse(
            z.array(
              z.object({
                examName: z.string().openapi({ example: "Mid-Term Examination 2026" }),
                gpa: z.number().openapi({ example: 4.88 }),
                percentage: z.number().openapi({ example: 86.4 }),
              })
            ),
            "Performance trend retrieved"
          ),
        },
      },
    },
  },
});
