import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import { DirectoryValidation } from "../../../modules/directory/directory.validation.js";
import { IdParamSchema } from "../components.js";

const TeacherDirectoryItemSchema = z.object({
  id: z.string().openapi({ example: "cly01tch_hasan101" }),
  firstName: z.string().openapi({ example: "Mohammad" }),
  lastName: z.string().openapi({ example: "Hasan" }),
  designation: z.string().openapi({ example: "Assistant Professor" }),
  department: z.string().openapi({ example: "Physics" }),
  email: z.string().nullable().optional().openapi({ example: "hasan@dhakacollege.edu.bd" }),
  phone: z.string().nullable().optional().openapi({ example: "+8801712345678" }),
  avatarUrl: z.string().nullable().optional().openapi({ example: "https://assets.education.bd/avatars/hasan.jpg" }),
});

const InstitutePublicProfileSchema = z.object({
  id: z.string().openapi({ example: "cly01inst_dhaka2026" }),
  name: z.string().openapi({ example: "Dhaka Residential Model College" }),
  code: z.string().openapi({ example: "DRMC-101" }),
  slug: z.string().openapi({ example: "drmc-dhaka" }),
  domain: z.string().nullable().optional().openapi({ example: "drmc.edu.bd" }),
  email: z.string().openapi({ example: "info@drmc.edu.bd" }),
  phone: z.string().nullable().optional().openapi({ example: "+8801711223344" }),
  address: z.string().nullable().optional().openapi({ example: "Mirpur Road, Mohammadpur, Dhaka-1207" }),
  website: z.string().nullable().optional().openapi({ example: "https://drmc.edu.bd" }),
  logoUrl: z.string().nullable().optional().openapi({ example: "https://assets.education.bd/logos/drmc.png" }),
  studentCount: z.number().int().openapi({ example: 2850 }),
  teacherCount: z.number().int().openapi({ example: 140 }),
});

// 1. GET /api/v1/directory/teachers
registerRoute({
  method: "get",
  path: "/api/v1/directory/teachers",
  tag: "Directory",
  summary: "Public/Internal Faculty Teacher Directory",
  permission: "directory.teacher.view",
  scope: "INSTITUTE",
  operationId: "directoryListTeachers",
  request: {
    query: z.object({
      page: z.string().optional().openapi({ example: "1" }),
      limit: z.string().optional().openapi({ example: "10" }),
      department: z.string().optional().openapi({ example: "Physics" }),
    }),
  },
  responses: {
    200: {
      description: "Faculty directory list",
      content: {
        "application/json": {
          schema: paginated(TeacherDirectoryItemSchema, "Faculty members retrieved"),
        },
      },
    },
  },
});

// 2. PATCH /api/v1/directory/teachers/me/visibility
registerRoute({
  method: "patch",
  path: "/api/v1/directory/teachers/me/visibility",
  tag: "Directory",
  summary: "Teacher self-manage contact visibility in directory",
  permission: "people.teacher.update",
  scope: "OWN",
  operationId: "directoryUpdateTeacherVisibility",
  request: {
    body: {
      content: {
        "application/json": {
          schema: DirectoryValidation.updateTeacherVisibilityZodSchema,
          example: {
            showEmail: true,
            showPhone: false,
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Visibility preferences updated",
      content: {
        "application/json": {
          schema: successResponse(z.object({ success: z.boolean() }), "Visibility updated"),
        },
      },
    },
  },
});

// 3. GET /api/v1/directory/teachers/:id
registerRoute({
  method: "get",
  path: "/api/v1/directory/teachers/:id",
  tag: "Directory",
  summary: "Get single faculty member directory profile",
  permission: "directory.teacher.view",
  scope: "INSTITUTE",
  operationId: "directoryGetTeacherById",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "Faculty profile details",
      content: {
        "application/json": {
          schema: successResponse(TeacherDirectoryItemSchema, "Faculty profile found"),
        },
      },
    },
  },
});

// 4. GET /api/v1/directory/staff
registerRoute({
  method: "get",
  path: "/api/v1/directory/staff",
  tag: "Directory",
  summary: "List staff member directory",
  permission: "directory.staff.view",
  scope: "INSTITUTE",
  operationId: "directoryListStaff",
  responses: {
    200: {
      description: "Staff directory list",
      content: {
        "application/json": {
          schema: paginated(TeacherDirectoryItemSchema, "Staff members retrieved"),
        },
      },
    },
  },
});

// 5. GET /api/v1/directory/institute/public-profile
registerRoute({
  method: "get",
  path: "/api/v1/directory/institute/public-profile",
  tag: "Directory",
  summary: "Institute public profile & campus information",
  permission: "directory.institute.view",
  scope: "INSTITUTE",
  operationId: "directoryGetInstitutePublicProfile",
  responses: {
    200: {
      description: "Public institute details",
      content: {
        "application/json": {
          schema: successResponse(InstitutePublicProfileSchema, "Institute profile retrieved"),
        },
      },
    },
  },
});

// 6. GET /api/v1/institute/public-profile
registerRoute({
  method: "get",
  path: "/api/v1/institute/public-profile",
  tag: "Directory",
  summary: "Public institute profile alias",
  permission: "directory.institute.view",
  scope: "INSTITUTE",
  operationId: "instituteGetPublicProfile",
  responses: {
    200: {
      description: "Institute profile details",
      content: {
        "application/json": {
          schema: successResponse(InstitutePublicProfileSchema, "Institute profile retrieved"),
        },
      },
    },
  },
});
