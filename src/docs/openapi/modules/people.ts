import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import { StudentValidation } from "../../../modules/people/student/student.validation.js";
import { TeacherValidation } from "../../../modules/people/teacher/teacher.validation.js";
import { GuardianValidation } from "../../../modules/people/guardian/guardian.validation.js";
import { StaffValidation } from "../../../modules/people/staff/staff.validation.js";
import { IdParamSchema } from "../components.js";

const StudentEntitySchema = z.object({
  id: z.string().openapi({ example: "cly01std_rahim2026" }),
  userId: z.string().openapi({ example: "cly01usr_rahim101" }),
  studentId: z.string().openapi({ example: "STD-2026-0042" }),
  instituteId: z.string().openapi({ example: "cly01inst_dhaka2026" }),
  firstName: z.string().openapi({ example: "Rahim" }),
  lastName: z.string().openapi({ example: "Uddin" }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).openapi({ example: "MALE" }),
  dob: z.string().openapi({ example: "2010-05-14" }),
  bloodGroup: z.string().nullable().optional().openapi({ example: "B+" }),
  emergencyContact: z.string().nullable().optional().openapi({ example: "+8801711223344" }),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "ALUMNI"]).openapi({ example: "ACTIVE" }),
  createdAt: z.string().openapi({ example: "2026-01-10T08:00:00.000Z" }),
});

const TeacherEntitySchema = z.object({
  id: z.string().openapi({ example: "cly01tch_hasan101" }),
  userId: z.string().openapi({ example: "cly01usr_hasan101" }),
  teacherId: z.string().openapi({ example: "TCH-2026-0012" }),
  instituteId: z.string().openapi({ example: "cly01inst_dhaka2026" }),
  firstName: z.string().openapi({ example: "Mohammad" }),
  lastName: z.string().openapi({ example: "Hasan" }),
  designation: z.string().openapi({ example: "Assistant Professor (Physics)" }),
  department: z.string().openapi({ example: "Department of Science" }),
  status: z.enum(["ACTIVE", "ON_LEAVE", "RESIGNED"]).openapi({ example: "ACTIVE" }),
  createdAt: z.string().openapi({ example: "2026-01-01T08:00:00.000Z" }),
});

const GuardianEntitySchema = z.object({
  id: z.string().openapi({ example: "cly01grd_karim101" }),
  userId: z.string().openapi({ example: "cly01usr_karim101" }),
  instituteId: z.string().openapi({ example: "cly01inst_dhaka2026" }),
  firstName: z.string().openapi({ example: "Karim" }),
  lastName: z.string().openapi({ example: "Chowdhury" }),
  relationship: z.string().openapi({ example: "Father" }),
  occupation: z.string().openapi({ example: "Civil Engineer" }),
  phone: z.string().openapi({ example: "+8801811223344" }),
  status: z.enum(["ACTIVE", "INACTIVE"]).openapi({ example: "ACTIVE" }),
});

const StaffEntitySchema = z.object({
  id: z.string().openapi({ example: "cly01stf_amin101" }),
  userId: z.string().openapi({ example: "cly01usr_amin101" }),
  staffId: z.string().openapi({ example: "STF-2026-0005" }),
  instituteId: z.string().openapi({ example: "cly01inst_dhaka2026" }),
  firstName: z.string().openapi({ example: "Ruhul" }),
  lastName: z.string().openapi({ example: "Amin" }),
  designation: z.string().openapi({ example: "Senior Accountant" }),
  staffType: z.string().openapi({ example: "ADMINISTRATIVE" }),
  status: z.enum(["ACTIVE", "INACTIVE"]).openapi({ example: "ACTIVE" }),
});

// -------------------------------------------------------------
// 1. Students
// -------------------------------------------------------------
registerRoute({
  method: "get",
  path: "/api/v1/people/students/me",
  tag: "People",
  summary: "Get current student's self-service profile",
  permission: "people.student.read",
  scope: "OWN",
  operationId: "peopleStudentGetMyProfile",
  responses: {
    200: {
      description: "Current student personal profile",
      content: {
        "application/json": {
          schema: successResponse(StudentEntitySchema, "Profile retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "patch",
  path: "/api/v1/people/students/me",
  tag: "People",
  summary: "Update current student's own contact details",
  permission: "people.student.update",
  scope: "OWN",
  operationId: "peopleStudentUpdateMyProfile",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StudentValidation.selfUpdateZodSchema,
          example: {
            phone: "+8801712345678",
            emergencyContact: "+8801711223344",
            bloodGroup: "B+",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Profile updated successfully",
      content: {
        "application/json": {
          schema: successResponse(StudentEntitySchema, "Profile updated"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/people/students",
  tag: "People",
  summary: "List enrolled students with filters",
  permission: "people.student.read",
  scope: "INSTITUTE",
  operationId: "peopleStudentList",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      limit: z.string().optional().openapi({ example: "10" }),
      searchTerm: z.string().optional().openapi({ example: "Rahim" }),
    }),
  },
  responses: {
    200: {
      description: "Paginated list of students",
      content: {
        "application/json": {
          schema: paginated(StudentEntitySchema, "Students retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/people/students",
  tag: "People",
  summary: "Enroll / create new student",
  permission: "people.student.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "peopleStudentCreate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StudentValidation.createZodSchema,
          example: {
            studentId: "STD-2026-0042",
            email: "rahim.uddin@student.dhakacollege.edu.bd",
            firstName: "Rahim",
            lastName: "Uddin",
            gender: "MALE",
            dob: "2010-05-14",
            bloodGroup: "B+",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Student created",
      content: {
        "application/json": {
          schema: successResponse(StudentEntitySchema, "Student registered successfully"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/people/students/:id",
  tag: "People",
  summary: "Get student details by ID",
  permission: "people.student.read",
  scope: "INSTITUTE",
  operationId: "peopleStudentGetById",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "Student profile",
      content: {
        "application/json": {
          schema: successResponse(StudentEntitySchema, "Student found"),
        },
      },
    },
  },
});

registerRoute({
  method: "patch",
  path: "/api/v1/people/students/:id",
  tag: "People",
  summary: "Admin update student record",
  permission: "people.student.update",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "peopleStudentAdminUpdate",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: StudentValidation.adminUpdateZodSchema,
          example: {
            status: "ACTIVE",
            bloodGroup: "B+",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Student record updated",
      content: {
        "application/json": {
          schema: successResponse(StudentEntitySchema, "Student updated"),
        },
      },
    },
  },
});

registerRoute({
  method: "delete",
  path: "/api/v1/people/students/:id",
  tag: "People",
  summary: "Delete / unenroll student",
  permission: "people.student.delete",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "peopleStudentDelete",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "Student deleted",
      content: {
        "application/json": {
          schema: successResponse(z.object({}), "Student deleted"),
        },
      },
    },
  },
});

// -------------------------------------------------------------
// 2. Teachers
// -------------------------------------------------------------
registerRoute({
  method: "get",
  path: "/api/v1/people/teachers/me",
  tag: "People",
  summary: "Get logged-in teacher self-service profile",
  permission: "people.teacher.read",
  scope: "OWN",
  operationId: "peopleTeacherGetMyProfile",
  responses: {
    200: {
      description: "Teacher self profile",
      content: {
        "application/json": {
          schema: successResponse(TeacherEntitySchema, "Teacher profile retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/people/teachers",
  tag: "People",
  summary: "List faculty teachers",
  permission: "people.teacher.read",
  scope: "INSTITUTE",
  operationId: "peopleTeacherList",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      limit: z.string().optional().openapi({ example: "10" }),
      department: z.string().optional().openapi({ example: "Physics" }),
    }),
  },
  responses: {
    200: {
      description: "Paginated list of teachers",
      content: {
        "application/json": {
          schema: paginated(TeacherEntitySchema, "Teachers retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/people/teachers",
  tag: "People",
  summary: "Appoint / add new teacher",
  permission: "people.teacher.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "peopleTeacherCreate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: TeacherValidation.createZodSchema,
          example: {
            email: "hasan.phys@dhakacollege.edu.bd",
            firstName: "Mohammad",
            lastName: "Hasan",
            designation: "Assistant Professor",
            department: "Department of Science",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Teacher created",
      content: {
        "application/json": {
          schema: successResponse(TeacherEntitySchema, "Teacher appointed"),
        },
      },
    },
  },
});

registerRoute({
  method: "get",
  path: "/api/v1/people/teachers/:id",
  tag: "People",
  summary: "Get teacher details by ID",
  permission: "people.teacher.read",
  scope: "INSTITUTE",
  operationId: "peopleTeacherGetById",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "Teacher profile",
      content: {
        "application/json": {
          schema: successResponse(TeacherEntitySchema, "Teacher found"),
        },
      },
    },
  },
});

// -------------------------------------------------------------
// 3. Guardians
// -------------------------------------------------------------
registerRoute({
  method: "get",
  path: "/api/v1/people/guardians",
  tag: "People",
  summary: "List registered student guardians",
  permission: "people.guardian.read",
  scope: "INSTITUTE",
  operationId: "peopleGuardianList",
  responses: {
    200: {
      description: "List of guardians",
      content: {
        "application/json": {
          schema: paginated(GuardianEntitySchema, "Guardians retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/people/guardians",
  tag: "People",
  summary: "Register new guardian and link to student",
  permission: "people.guardian.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "peopleGuardianCreate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GuardianValidation.createZodSchema,
          example: {
            email: "karim.chowdhury@gmail.com",
            firstName: "Karim",
            lastName: "Chowdhury",
            phone: "+8801811223344",
            relationship: "Father",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Guardian created",
      content: {
        "application/json": {
          schema: successResponse(GuardianEntitySchema, "Guardian registered"),
        },
      },
    },
  },
});

// -------------------------------------------------------------
// 4. Staff
// -------------------------------------------------------------
registerRoute({
  method: "get",
  path: "/api/v1/people/staff",
  tag: "People",
  summary: "List administrative and support staff members",
  permission: "people.staff.read",
  scope: "INSTITUTE",
  operationId: "peopleStaffList",
  responses: {
    200: {
      description: "Staff list",
      content: {
        "application/json": {
          schema: paginated(StaffEntitySchema, "Staff members retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/people/staff",
  tag: "People",
  summary: "Add new staff employee",
  permission: "people.staff.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "peopleStaffCreate",
  request: {
    body: {
      content: {
        "application/json": {
          schema: StaffValidation.createZodSchema,
          example: {
            email: "ruhul.amin@dhakacollege.edu.bd",
            firstName: "Ruhul",
            lastName: "Amin",
            designation: "Senior Accountant",
            staffType: "ADMINISTRATIVE",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Staff created",
      content: {
        "application/json": {
          schema: successResponse(StaffEntitySchema, "Staff created"),
        },
      },
    },
  },
});
