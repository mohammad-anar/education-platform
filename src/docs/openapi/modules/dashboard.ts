import { z } from "zod";
import { registerRoute, successResponse } from "../helpers.js";

const TeacherDashboardSchema = z.object({
  assignedClassCount: z.number().int().openapi({ example: 4 }),
  totalStudentsTaught: z.number().int().openapi({ example: 185 }),
  todayClassesCount: z.number().int().openapi({ example: 3 }),
  pendingAttendanceCount: z.number().int().openapi({ example: 1 }),
  pendingGradingCount: z.number().int().openapi({ example: 14 }),
  averageAttendanceRate: z.number().openapi({ example: 87.4 }),
});

const AdminDashboardSchema = z.object({
  totalStudents: z.number().int().openapi({ example: 2850 }),
  totalTeachers: z.number().int().openapi({ example: 140 }),
  activeSections: z.number().int().openapi({ example: 48 }),
  instituteAttendanceToday: z.number().openapi({ example: 91.2 }),
  activeEnrollments: z.number().int().openapi({ example: 2850 }),
  openSupportTickets: z.number().int().openapi({ example: 7 }),
});

const GuardianDashboardSchema = z.object({
  childId: z.string().openapi({ example: "cly01std_rahim2026" }),
  childName: z.string().openapi({ example: "Rahim Uddin" }),
  rollNumber: z.string().openapi({ example: "01" }),
  className: z.string().openapi({ example: "Class XI Science - Padma" }),
  overallAttendancePercentage: z.number().openapi({ example: 88.5 }),
  latestExamGPA: z.number().openapi({ example: 4.88 }),
  unpaidFeesBDT: z.number().openapi({ example: 0 }),
});

// 1. Teacher Dashboard
registerRoute({
  method: "get",
  path: "/api/v1/dashboard/teacher",
  tag: "Role Dashboards",
  summary: "Aggregated KPI overview for logged-in teacher",
  permission: "teacher.dashboard.view",
  scope: "ASSIGNED",
  operationId: "dashboardGetTeacherSummary",
  responses: {
    200: {
      description: "Teacher KPI metrics",
      content: {
        "application/json": {
          schema: successResponse(TeacherDashboardSchema, "Teacher dashboard loaded"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/dashboard/teacher/pending-attendance",
  tag: "Role Dashboards",
  summary: "List class sessions awaiting attendance marking",
  permission: "teacher.dashboard.view",
  scope: "ASSIGNED",
  operationId: "dashboardGetTeacherPendingAttendance",
  responses: {
    200: {
      description: "Pending attendance sessions",
      content: {
        "application/json": {
          schema: successResponse(
            z.array(
              z.object({
                sessionId: z.string().openapi({ example: "cly01ses_phy_oct18" }),
                subjectName: z.string().openapi({ example: "Physics 1st Paper" }),
                sectionName: z.string().openapi({ example: "Section A (Padma)" }),
                date: z.string().openapi({ example: "2026-10-18" }),
              })
            ),
            "Pending sessions retrieved"
          ),
        },
      },
    },
  },
});

// 2. Admin Dashboard
registerRoute({
  method: "get",
  path: "/api/v1/dashboard/admin",
  tag: "Role Dashboards",
  summary: "High-level institutional KPI overview for Institute Admin",
  permission: "admin.dashboard.view",
  scope: "INSTITUTE",
  operationId: "dashboardGetAdminSummary",
  responses: {
    200: {
      description: "Admin overview metrics",
      content: {
        "application/json": {
          schema: successResponse(AdminDashboardSchema, "Admin dashboard loaded"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/dashboard/admin/enrollment-trend",
  tag: "Role Dashboards",
  summary: "Monthly student enrollment and retention progression trend",
  permission: "admin.dashboard.view",
  scope: "INSTITUTE",
  operationId: "dashboardGetAdminEnrollmentTrend",
  responses: {
    200: {
      description: "Enrollment trend timeline",
      content: {
        "application/json": {
          schema: successResponse(
            z.array(
              z.object({
                month: z.string().openapi({ example: "2026-01" }),
                count: z.number().int().openapi({ example: 2850 }),
              })
            ),
            "Enrollment trend retrieved"
          ),
        },
      },
    },
  },
});

// 3. Guardian Dashboard
registerRoute({
  method: "get",
  path: "/api/v1/dashboard/guardian",
  tag: "Role Dashboards",
  summary: "Guardian parent portal home with linked children",
  permission: "guardian.dashboard.view",
  scope: "OWN",
  operationId: "dashboardGetGuardianSummary",
  responses: {
    200: {
      description: "Guardian children overview",
      content: {
        "application/json": {
          schema: successResponse(z.array(GuardianDashboardSchema), "Guardian dashboard loaded"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/dashboard/guardian/children/:childId",
  tag: "Role Dashboards",
  summary: "Detailed progress report for specific child",
  permission: "guardian.dashboard.view",
  scope: "OWN",
  operationId: "dashboardGetChildDetail",
  request: {
    params: z.object({
      childId: z.string().openapi({ example: "cly01std_rahim2026" }),
    }),
  },
  responses: {
    200: {
      description: "Child performance card",
      content: {
        "application/json": {
          schema: successResponse(GuardianDashboardSchema, "Child report loaded"),
        },
      },
    },
  },
});
