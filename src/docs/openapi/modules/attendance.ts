import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import { PolicyValidation } from "../../../modules/attendance/policy/policy.validation.js";
import { CalendarValidation } from "../../../modules/attendance/calendar/calendar.validation.js";
import { SessionValidation } from "../../../modules/attendance/session/session.validation.js";
import { RoutineValidation } from "../../../modules/attendance/routine/routine.validation.js";
import { LiveClassValidation } from "../../../modules/attendance/liveClass/liveClass.validation.js";
import { IdParamSchema } from "../components.js";

const AttendancePolicySchema = z.object({
  id: z.string().openapi({ example: "cly01plc_hsc_default" }),
  name: z.string().openapi({ example: "HSC Mandatory 75% Attendance Policy" }),
  minPercentage: z.number().openapi({ example: 75.0 }),
  presentWeight: z.number().openapi({ example: 1.0 }),
  lateWeight: z.number().openapi({ example: 0.5 }),
  absentWeight: z.number().openapi({ example: 0.0 }),
  excusedWeight: z.number().openapi({ example: 1.0 }),
  halfDayWeight: z.number().openapi({ example: 0.5 }),
  gracePeriodMinutes: z.number().int().openapi({ example: 15 }),
});

const CalendarExceptionSchema = z.object({
  id: z.string().openapi({ example: "cly01cal_eid2026" }),
  title: z.string().openapi({ example: "Eid-ul-Fitr Vacation" }),
  startDate: z.string().openapi({ example: "2026-03-20" }),
  endDate: z.string().openapi({ example: "2026-03-26" }),
  isHoliday: z.boolean().openapi({ example: true }),
  description: z.string().nullable().optional().openapi({ example: "Government public holiday for Eid-ul-Fitr" }),
});

const AttendanceSessionSchema = z.object({
  id: z.string().openapi({ example: "cly01ses_phy_oct18" }),
  sectionId: z.string().openapi({ example: "cly01sec_padma" }),
  subjectId: z.string().openapi({ example: "cly01sbj_phy1" }),
  teacherId: z.string().openapi({ example: "cly01tch_hasan101" }),
  date: z.string().openapi({ example: "2026-10-18" }),
  startTime: z.string().openapi({ example: "09:00:00" }),
  endTime: z.string().openapi({ example: "09:45:00" }),
  status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).openapi({ example: "COMPLETED" }),
  totalStudents: z.number().int().openapi({ example: 55 }),
  presentCount: z.number().int().openapi({ example: 52 }),
  absentCount: z.number().int().openapi({ example: 3 }),
});

const RoutineSchema = z.object({
  id: z.string().openapi({ example: "cly01rtn_mon_phy" }),
  sectionId: z.string().openapi({ example: "cly01sec_padma" }),
  subjectId: z.string().openapi({ example: "cly01sbj_phy1" }),
  teacherId: z.string().openapi({ example: "cly01tch_hasan101" }),
  dayOfWeek: z.enum(["SATURDAY", "SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]).openapi({ example: "SUNDAY" }),
  startTime: z.string().openapi({ example: "09:00" }),
  endTime: z.string().openapi({ example: "09:45" }),
  roomNumber: z.string().nullable().optional().openapi({ example: "Lab-3" }),
});

const LiveClassSchema = z.object({
  id: z.string().openapi({ example: "cly01lvc_zoom_phy" }),
  title: z.string().openapi({ example: "Physics 1st Paper - Vector Analysis Live Session" }),
  meetingUrl: z.string().openapi({ example: "https://zoom.us/j/987654321" }),
  meetingId: z.string().openapi({ example: "987 654 321" }),
  passcode: z.string().nullable().optional().openapi({ example: "vector2026" }),
  startTime: z.string().openapi({ example: "2026-10-18T10:00:00.000Z" }),
  endTime: z.string().openapi({ example: "2026-10-18T11:00:00.000Z" }),
  provider: z.enum(["ZOOM", "GOOGLE_MEET", "CUSTOM"]).openapi({ example: "ZOOM" }),
});

// 1. Policies
registerRoute({
  method: "get",
  path: "/api/v1/attendance/policies",
  tag: "Attendance",
  summary: "List attendance scoring policies",
  permission: "attendance.policy.read",
  scope: "INSTITUTE",
  operationId: "attendanceListPolicies",
  responses: {
    200: {
      description: "Attendance policies",
      content: {
        "application/json": {
          schema: paginated(AttendancePolicySchema, "Policies retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/attendance/policies",
  tag: "Attendance",
  summary: "Create attendance policy",
  permission: "attendance.policy.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "attendanceCreatePolicy",
  request: {
    body: {
      content: {
        "application/json": {
          schema: PolicyValidation.createZodSchema,
          example: {
            name: "HSC Mandatory 75% Attendance Policy",
            minPercentage: 75.0,
            presentWeight: 1.0,
            lateWeight: 0.5,
            absentWeight: 0.0,
            excusedWeight: 1.0,
            gracePeriodMinutes: 15,
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Policy created",
      content: {
        "application/json": {
          schema: successResponse(AttendancePolicySchema, "Policy created"),
        },
      },
    },
  },
});

// 2. Calendars
registerRoute({
  method: "get",
  path: "/api/v1/attendance/calendars",
  tag: "Attendance",
  summary: "List academic calendar holidays and exceptions",
  permission: "attendance.calendar.read",
  scope: "INSTITUTE",
  operationId: "attendanceListCalendars",
  responses: {
    200: {
      description: "Holidays list",
      content: {
        "application/json": {
          schema: paginated(CalendarExceptionSchema, "Calendar entries retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/attendance/calendars",
  tag: "Attendance",
  summary: "Add academic holiday / exception",
  permission: "attendance.calendar.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "attendanceCreateCalendar",
  request: {
    body: {
      content: {
        "application/json": {
          schema: CalendarValidation.createZodSchema,
          example: {
            title: "Eid-ul-Fitr Vacation",
            startDate: "2026-03-20",
            endDate: "2026-03-26",
            isHoliday: true,
            description: "National public holiday",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Calendar exception added",
      content: {
        "application/json": {
          schema: successResponse(CalendarExceptionSchema, "Holiday added"),
        },
      },
    },
  },
});

// 3. Sessions & Marking
registerRoute({
  method: "get",
  path: "/api/v1/attendance/sessions",
  tag: "Attendance",
  summary: "List attendance taking sessions",
  permission: "attendance.session.read",
  scope: "INSTITUTE",
  operationId: "attendanceListSessions",
  responses: {
    200: {
      description: "Attendance sessions",
      content: {
        "application/json": {
          schema: paginated(AttendanceSessionSchema, "Sessions retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/attendance/sessions",
  tag: "Attendance",
  summary: "Create attendance session for class period",
  permission: "attendance.session.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "attendanceCreateSession",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SessionValidation.createZodSchema,
          example: {
            sectionId: "cly01sec_padma",
            subjectId: "cly01sbj_phy1",
            date: "2026-10-18",
            startTime: "09:00:00",
            endTime: "09:45:00",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Attendance session scheduled",
      content: {
        "application/json": {
          schema: successResponse(AttendanceSessionSchema, "Session created"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/attendance/sessions/:id/mark",
  tag: "Attendance",
  summary: "Batch mark attendance for all students in session",
  permission: "attendance.session.update",
  scope: "ASSIGNED",
  auditLogged: true,
  operationId: "attendanceMarkSession",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            records: z.array(
              z.object({
                studentId: z.string().openapi({ example: "cly01std_rahim2026" }),
                status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]).openapi({ example: "PRESENT" }),
                remarks: z.string().optional().openapi({ example: "Arrived on time" }),
              })
            ),
          }),
          example: {
            records: [
              { studentId: "cly01std_rahim2026", status: "PRESENT" },
              { studentId: "cly01std_karim2026", status: "LATE", remarks: "Traffic delay" },
            ],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Attendance saved and attendance_marked event emitted",
      content: {
        "application/json": {
          schema: successResponse(z.object({ markedCount: z.number().int() }), "Attendance saved successfully"),
        },
      },
    },
  },
});

// 4. Routines (Timetable)
registerRoute({
  method: "get",
  path: "/api/v1/attendance/routines",
  tag: "Attendance",
  summary: "List weekly class timetable routines",
  permission: "attendance.routine.read",
  scope: "INSTITUTE",
  operationId: "attendanceListRoutines",
  responses: {
    200: {
      description: "Weekly timetable routines",
      content: {
        "application/json": {
          schema: paginated(RoutineSchema, "Routines retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/attendance/routines",
  tag: "Attendance",
  summary: "Schedule routine timetable period",
  permission: "attendance.routine.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "attendanceCreateRoutine",
  request: {
    body: {
      content: {
        "application/json": {
          schema: RoutineValidation.createZodSchema,
          example: {
            sectionId: "cly01sec_padma",
            subjectId: "cly01sbj_phy1",
            teacherId: "cly01tch_hasan101",
            dayOfWeek: "SUNDAY",
            startTime: "09:00",
            endTime: "09:45",
            roomNumber: "Lab-3",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Routine scheduled",
      content: {
        "application/json": {
          schema: successResponse(RoutineSchema, "Routine saved"),
        },
      },
    },
  },
});

// 5. Live Classes
registerRoute({
  method: "get",
  path: "/api/v1/attendance/live-classes",
  tag: "Attendance",
  summary: "List live interactive online classes",
  permission: "attendance.liveClass.read",
  scope: "INSTITUTE",
  operationId: "attendanceListLiveClasses",
  responses: {
    200: {
      description: "Live class listings",
      content: {
        "application/json": {
          schema: paginated(LiveClassSchema, "Live classes retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/attendance/live-classes",
  tag: "Attendance",
  summary: "Schedule live Zoom/Google Meet online class",
  permission: "attendance.liveClass.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "attendanceCreateLiveClass",
  request: {
    body: {
      content: {
        "application/json": {
          schema: LiveClassValidation.createZodSchema,
          example: {
            title: "Physics 1st Paper - Vector Analysis Live Session",
            meetingUrl: "https://zoom.us/j/987654321",
            meetingId: "987 654 321",
            passcode: "vector2026",
            startTime: "2026-10-18T10:00:00.000Z",
            endTime: "2026-10-18T11:00:00.000Z",
            provider: "ZOOM",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Live class scheduled",
      content: {
        "application/json": {
          schema: successResponse(LiveClassSchema, "Live class created"),
        },
      },
    },
  },
});
