import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import { AcademicYearValidation } from "../../../modules/academic/academicYear/academicYear.validation.js";
import { ProgramValidation } from "../../../modules/academic/program/program.validation.js";
import { LevelValidation } from "../../../modules/academic/level/level.validation.js";
import { ClassGroupValidation } from "../../../modules/academic/classGroup/classGroup.validation.js";
import { SectionValidation } from "../../../modules/academic/section/section.validation.js";
import { SubjectValidation } from "../../../modules/academic/subject/subject.validation.js";
import { EnrollmentValidation } from "../../../modules/academic/enrollment/enrollment.validation.js";
import { IdParamSchema } from "../components.js";

const AcademicYearSchema = z.object({
  id: z.string().openapi({ example: "cly01yr_2026" }),
  name: z.string().openapi({ example: "Academic Year 2026-2027" }),
  code: z.string().openapi({ example: "AY-2026" }),
  startDate: z.string().openapi({ example: "2026-01-01T00:00:00.000Z" }),
  endDate: z.string().openapi({ example: "2026-12-31T23:59:59.000Z" }),
  isCurrent: z.boolean().openapi({ example: true }),
  status: z.enum(["ACTIVE", "ARCHIVED", "UPCOMING"]).openapi({ example: "ACTIVE" }),
});

const ProgramSchema = z.object({
  id: z.string().openapi({ example: "cly01prg_hsc_sci" }),
  name: z.string().openapi({ example: "Higher Secondary Certificate (HSC) - Science" }),
  code: z.string().openapi({ example: "HSC-SCI" }),
  description: z.string().nullable().optional().openapi({ example: "Two-year college science curriculum following NCTB" }),
  status: z.string().openapi({ example: "ACTIVE" }),
});

const LevelSchema = z.object({
  id: z.string().openapi({ example: "cly01lvl_11" }),
  name: z.string().openapi({ example: "Class 11 (XI)" }),
  code: z.string().openapi({ example: "XI" }),
  sequence: z.number().int().openapi({ example: 11 }),
  programId: z.string().openapi({ example: "cly01prg_hsc_sci" }),
});

const ClassGroupSchema = z.object({
  id: z.string().openapi({ example: "cly01cls_xi_sci" }),
  name: z.string().openapi({ example: "Class XI Science" }),
  code: z.string().openapi({ example: "XI-SCI" }),
  levelId: z.string().openapi({ example: "cly01lvl_11" }),
  academicYearId: z.string().openapi({ example: "cly01yr_2026" }),
});

const SectionSchema = z.object({
  id: z.string().openapi({ example: "cly01sec_padma" }),
  name: z.string().openapi({ example: "Section A (Padma)" }),
  code: z.string().openapi({ example: "SEC-A-PADMA" }),
  capacity: z.number().int().openapi({ example: 60 }),
  classGroupId: z.string().openapi({ example: "cly01cls_xi_sci" }),
  roomNumber: z.string().nullable().optional().openapi({ example: "Academic Bldg-2 Room 304" }),
});

const SubjectSchema = z.object({
  id: z.string().openapi({ example: "cly01sbj_phy1" }),
  name: z.string().openapi({ example: "Physics 1st Paper" }),
  code: z.string().openapi({ example: "PHY-101" }),
  creditHours: z.number().openapi({ example: 3 }),
  isOptional: z.boolean().openapi({ example: false }),
  classGroupId: z.string().openapi({ example: "cly01cls_xi_sci" }),
});

const EnrollmentSchema = z.object({
  id: z.string().openapi({ example: "cly01enr_rahim101" }),
  studentId: z.string().openapi({ example: "cly01std_rahim2026" }),
  academicYearId: z.string().openapi({ example: "cly01yr_2026" }),
  sectionId: z.string().openapi({ example: "cly01sec_padma" }),
  rollNumber: z.string().openapi({ example: "01" }),
  status: z.enum(["ENROLLED", "PROMOTED", "TRANSFERRED", "DROPPED"]).openapi({ example: "ENROLLED" }),
  enrolledAt: z.string().openapi({ example: "2026-01-10T08:00:00.000Z" }),
});

// Helper for standard 5 CRUD routes
function registerCrudRoutes<T extends z.ZodTypeAny>(opts: {
  resourcePath: string;
  name: string;
  schema: T;
  permissionPrefix: string;
  createValidation: z.ZodTypeAny;
  updateValidation: z.ZodTypeAny;
  exampleCreate: any;
}) {
  // 1. GET list
  registerRoute({
    method: "get",
    path: `/api/v1/academic/${opts.resourcePath}`,
    tag: "Academic",
    summary: `List ${opts.name} records`,
    permission: `${opts.permissionPrefix}.read`,
    scope: "INSTITUTE",
    operationId: `academicList_${opts.resourcePath}`,
    responses: {
      200: {
        description: `List of ${opts.name}`,
        content: {
          "application/json": {
            schema: paginated(opts.schema, `${opts.name} retrieved successfully`),
          },
        },
      },
    },
  });

  // 2. POST create
  registerRoute({
    method: "post",
    path: `/api/v1/academic/${opts.resourcePath}`,
    tag: "Academic",
    summary: `Create new ${opts.name}`,
    permission: `${opts.permissionPrefix}.create`,
    scope: "INSTITUTE",
    auditLogged: true,
    operationId: `academicCreate_${opts.resourcePath}`,
    request: {
      body: {
        content: {
          "application/json": {
            schema: opts.createValidation,
            example: opts.exampleCreate,
          },
        },
      },
    },
    responses: {
      201: {
        description: `${opts.name} created successfully`,
        content: {
          "application/json": {
            schema: successResponse(opts.schema, `${opts.name} created`),
          },
        },
      },
    },
  });

  // 3. GET :id
  registerRoute({
    method: "get",
    path: `/api/v1/academic/${opts.resourcePath}/:id`,
    tag: "Academic",
    summary: `Get ${opts.name} details by ID`,
    permission: `${opts.permissionPrefix}.read`,
    scope: "INSTITUTE",
    operationId: `academicGetById_${opts.resourcePath}`,
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: `${opts.name} found`,
        content: {
          "application/json": {
            schema: successResponse(opts.schema, `${opts.name} found`),
          },
        },
      },
    },
  });

  // 4. PATCH :id
  registerRoute({
    method: "patch",
    path: `/api/v1/academic/${opts.resourcePath}/:id`,
    tag: "Academic",
    summary: `Update ${opts.name} record`,
    permission: `${opts.permissionPrefix}.update`,
    scope: "INSTITUTE",
    auditLogged: true,
    operationId: `academicUpdate_${opts.resourcePath}`,
    request: {
      params: IdParamSchema,
      body: {
        content: {
          "application/json": {
            schema: opts.updateValidation,
            example: opts.exampleCreate,
          },
        },
      },
    },
    responses: {
      200: {
        description: `${opts.name} updated successfully`,
        content: {
          "application/json": {
            schema: successResponse(opts.schema, `${opts.name} updated`),
          },
        },
      },
    },
  });

  // 5. DELETE :id
  registerRoute({
    method: "delete",
    path: `/api/v1/academic/${opts.resourcePath}/:id`,
    tag: "Academic",
    summary: `Delete ${opts.name} record`,
    permission: `${opts.permissionPrefix}.delete`,
    scope: "INSTITUTE",
    auditLogged: true,
    operationId: `academicDelete_${opts.resourcePath}`,
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: `${opts.name} deleted successfully`,
        content: {
          "application/json": {
            schema: successResponse(z.object({}), `${opts.name} deleted`),
          },
        },
      },
    },
  });
}

// Register all 7 Academic Resources
registerCrudRoutes({
  resourcePath: "years",
  name: "Academic Year",
  schema: AcademicYearSchema,
  permissionPrefix: "academic.academicYear",
  createValidation: AcademicYearValidation.createZodSchema,
  updateValidation: AcademicYearValidation.updateZodSchema,
  exampleCreate: {
    name: "Academic Year 2026-2027",
    code: "AY-2026",
    startDate: "2026-01-01T00:00:00.000Z",
    endDate: "2026-12-31T23:59:59.000Z",
    isCurrent: true,
  },
});

registerCrudRoutes({
  resourcePath: "programs",
  name: "Academic Program",
  schema: ProgramSchema,
  permissionPrefix: "academic.program",
  createValidation: ProgramValidation.createZodSchema,
  updateValidation: ProgramValidation.updateZodSchema,
  exampleCreate: {
    name: "Higher Secondary Certificate (HSC) - Science",
    code: "HSC-SCI",
    description: "NCTB Curriculum Science Stream with Physics, Chemistry, Biology & Math",
  },
});

registerCrudRoutes({
  resourcePath: "levels",
  name: "Academic Level",
  schema: LevelSchema,
  permissionPrefix: "academic.level",
  createValidation: LevelValidation.createZodSchema,
  updateValidation: LevelValidation.updateZodSchema,
  exampleCreate: {
    name: "Class 11 (XI)",
    code: "XI",
    sequence: 11,
    programId: "cly01prg_hsc_sci",
  },
});

registerCrudRoutes({
  resourcePath: "classes",
  name: "Class Group",
  schema: ClassGroupSchema,
  permissionPrefix: "academic.classGroup",
  createValidation: ClassGroupValidation.createZodSchema,
  updateValidation: ClassGroupValidation.updateZodSchema,
  exampleCreate: {
    name: "Class XI Science",
    code: "XI-SCI",
    levelId: "cly01lvl_11",
    academicYearId: "cly01yr_2026",
  },
});

registerCrudRoutes({
  resourcePath: "sections",
  name: "Class Section",
  schema: SectionSchema,
  permissionPrefix: "academic.section",
  createValidation: SectionValidation.createZodSchema,
  updateValidation: SectionValidation.updateZodSchema,
  exampleCreate: {
    name: "Section A (Padma)",
    code: "SEC-A-PADMA",
    capacity: 60,
    classGroupId: "cly01cls_xi_sci",
    roomNumber: "Academic Bldg-2 Room 304",
  },
});

registerCrudRoutes({
  resourcePath: "subjects",
  name: "Academic Subject",
  schema: SubjectSchema,
  permissionPrefix: "academic.subject",
  createValidation: SubjectValidation.createZodSchema,
  updateValidation: SubjectValidation.updateZodSchema,
  exampleCreate: {
    name: "Physics 1st Paper",
    code: "PHY-101",
    creditHours: 3,
    isOptional: false,
    classGroupId: "cly01cls_xi_sci",
  },
});

registerCrudRoutes({
  resourcePath: "enrollments",
  name: "Student Enrollment",
  schema: EnrollmentSchema,
  permissionPrefix: "academic.enrollment",
  createValidation: EnrollmentValidation.createZodSchema,
  updateValidation: EnrollmentValidation.updateZodSchema,
  exampleCreate: {
    studentId: "cly01std_rahim2026",
    academicYearId: "cly01yr_2026",
    sectionId: "cly01sec_padma",
    rollNumber: "01",
  },
});
