import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import { CourseValidation } from "../../../modules/lms/course/course.validation.js";
import { MilestoneValidation } from "../../../modules/lms/milestone/milestone.validation.js";
import { ModuleValidation } from "../../../modules/lms/module/module.validation.js";
import { LearningItemValidation } from "../../../modules/lms/learningItem/learningItem.validation.js";
import { LessonValidation } from "../../../modules/lms/lesson/lesson.validation.js";
import { LessonVideoValidation } from "../../../modules/lms/lessonVideo/lessonVideo.validation.js";
import { LessonNoteValidation } from "../../../modules/lms/lessonNote/lessonNote.validation.js";
import { CourseEnrollmentValidation } from "../../../modules/lms/courseEnrollment/courseEnrollment.validation.js";
import { BundleValidation } from "../../../modules/lms/bundle/bundle.validation.js";
import { IdParamSchema } from "../components.js";

const CourseSchema = z.object({
  id: z.string().openapi({ example: "cly01crs_hsc_phys" }),
  title: z.string().openapi({ example: "HSC 2026 Complete Physics Masterclass" }),
  slug: z.string().openapi({ example: "hsc-2026-complete-physics" }),
  description: z.string().openapi({ example: "Comprehensive video lectures covering Paper 1 & 2" }),
  priceBDT: z.number().openapi({ example: 4500 }),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).openapi({ example: "PUBLISHED" }),
  instructorId: z.string().openapi({ example: "cly01tch_hasan101" }),
  thumbnailUrl: z.string().nullable().optional().openapi({ example: "https://assets.education.bd/courses/physics.jpg" }),
});

const MilestoneSchema = z.object({
  id: z.string().openapi({ example: "cly01mls_term1" }),
  title: z.string().openapi({ example: "Milestone 1: Mechanics & Gravitation" }),
  order: z.number().int().openapi({ example: 1 }),
  courseId: z.string().openapi({ example: "cly01crs_hsc_phys" }),
});

const ModuleSchema = z.object({
  id: z.string().openapi({ example: "cly01mod_vectors" }),
  title: z.string().openapi({ example: "Module 2: Vector Mathematics and Operations" }),
  order: z.number().int().openapi({ example: 2 }),
  milestoneId: z.string().openapi({ example: "cly01mls_term1" }),
});

const LessonSchema = z.object({
  id: z.string().openapi({ example: "cly01lsn_dot_product" }),
  title: z.string().openapi({ example: "Lesson 2.1: Dot Product and Applications" }),
  order: z.number().int().openapi({ example: 1 }),
  durationMinutes: z.number().openapi({ example: 35 }),
  moduleId: z.string().openapi({ example: "cly01mod_vectors" }),
});

const LessonVideoSchema = z.object({
  id: z.string().openapi({ example: "cly01vid_dot_prod" }),
  lessonId: z.string().openapi({ example: "cly01lsn_dot_product" }),
  videoUrl: z.string().openapi({ example: "https://cdn.education.bd/videos/physics-vec-dot.m3u8" }),
  durationSeconds: z.number().openapi({ example: 2100 }),
  provider: z.enum(["CLOUDINARY", "HLS", "YOUTUBE", "VIMEO"]).openapi({ example: "HLS" }),
});

const LessonNoteSchema = z.object({
  id: z.string().openapi({ example: "cly01not_dot_prod" }),
  lessonId: z.string().openapi({ example: "cly01lsn_dot_product" }),
  title: z.string().openapi({ example: "Lecture Notes & Formula Sheet (PDF)" }),
  fileUrl: z.string().openapi({ example: "https://cdn.education.bd/notes/vector-formulas.pdf" }),
});

const CourseEnrollmentSchema = z.object({
  id: z.string().openapi({ example: "cly01cenr_rahim101" }),
  studentId: z.string().openapi({ example: "cly01std_rahim2026" }),
  courseId: z.string().openapi({ example: "cly01crs_hsc_phys" }),
  progressPercent: z.number().openapi({ example: 64.5 }),
  enrolledAt: z.string().openapi({ example: "2026-02-01T00:00:00.000Z" }),
  completedAt: z.string().nullable().optional(),
});

const BundleSchema = z.object({
  id: z.string().openapi({ example: "cly01bnd_hsc_full" }),
  title: z.string().openapi({ example: "HSC Science Trio Bundle (Physics + Chemistry + Math)" }),
  priceBDT: z.number().openapi({ example: 9999 }),
  discountPercent: z.number().openapi({ example: 25 }),
  status: z.enum(["ACTIVE", "INACTIVE"]).openapi({ example: "ACTIVE" }),
});

// Helper for standard LMS CRUD
function registerLmsCrud<T extends z.ZodTypeAny>(opts: {
  path: string;
  name: string;
  schema: T;
  permissionPrefix: string;
  createValidation: z.ZodTypeAny;
  updateValidation: z.ZodTypeAny;
  exampleCreate: any;
}) {
  registerRoute({
    method: "get",
    path: `/api/v1/lms/${opts.path}`,
    tag: "LMS",
    summary: `List ${opts.name} records`,
    permission: `${opts.permissionPrefix}.read`,
    scope: "INSTITUTE",
    operationId: `lmsList_${opts.path.replace(/-/g, "_")}`,
    responses: {
      200: {
        description: `List of ${opts.name}`,
        content: {
          "application/json": {
            schema: paginated(opts.schema, `${opts.name} retrieved`),
          },
        },
      },
    },
  });

  registerRoute({
    method: "post",
    path: `/api/v1/lms/${opts.path}`,
    tag: "LMS",
    summary: `Create new ${opts.name}`,
    permission: `${opts.permissionPrefix}.create`,
    scope: "INSTITUTE",
    auditLogged: true,
    operationId: `lmsCreate_${opts.path.replace(/-/g, "_")}`,
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
        description: `${opts.name} created`,
        content: {
          "application/json": {
            schema: successResponse(opts.schema, `${opts.name} created`),
          },
        },
      },
    },
  });

  registerRoute({
    method: "get",
    path: `/api/v1/lms/${opts.path}/:id`,
    tag: "LMS",
    summary: `Get ${opts.name} by ID`,
    permission: `${opts.permissionPrefix}.read`,
    scope: "INSTITUTE",
    operationId: `lmsGetById_${opts.path.replace(/-/g, "_")}`,
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: `${opts.name} details`,
        content: {
          "application/json": {
            schema: successResponse(opts.schema, `${opts.name} found`),
          },
        },
      },
    },
  });

  registerRoute({
    method: "patch",
    path: `/api/v1/lms/${opts.path}/:id`,
    tag: "LMS",
    summary: `Update ${opts.name}`,
    permission: `${opts.permissionPrefix}.update`,
    scope: "INSTITUTE",
    auditLogged: true,
    operationId: `lmsUpdate_${opts.path.replace(/-/g, "_")}`,
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
        description: `${opts.name} updated`,
        content: {
          "application/json": {
            schema: successResponse(opts.schema, `${opts.name} updated`),
          },
        },
      },
    },
  });

  registerRoute({
    method: "delete",
    path: `/api/v1/lms/${opts.path}/:id`,
    tag: "LMS",
    summary: `Delete ${opts.name}`,
    permission: `${opts.permissionPrefix}.delete`,
    scope: "INSTITUTE",
    auditLogged: true,
    operationId: `lmsDelete_${opts.path.replace(/-/g, "_")}`,
    request: { params: IdParamSchema },
    responses: {
      200: {
        description: `${opts.name} deleted`,
        content: {
          "application/json": {
            schema: successResponse(z.object({}), `${opts.name} deleted`),
          },
        },
      },
    },
  });
}

// 1. Courses
registerLmsCrud({
  path: "courses",
  name: "Course",
  schema: CourseSchema,
  permissionPrefix: "lms.course",
  createValidation: CourseValidation.createZodSchema,
  updateValidation: CourseValidation.updateZodSchema,
  exampleCreate: {
    title: "HSC 2026 Complete Physics Masterclass",
    slug: "hsc-2026-complete-physics",
    description: "Comprehensive video lectures covering Paper 1 & 2 with CQ & MCQ practice",
    priceBDT: 4500,
  },
});

// 2. Milestones
registerLmsCrud({
  path: "milestones",
  name: "Course Milestone",
  schema: MilestoneSchema,
  permissionPrefix: "lms.milestone",
  createValidation: MilestoneValidation.createZodSchema,
  updateValidation: MilestoneValidation.updateZodSchema,
  exampleCreate: {
    title: "Milestone 1: Mechanics & Gravitation",
    order: 1,
    courseId: "cly01crs_hsc_phys",
  },
});

// 3. Modules
registerLmsCrud({
  path: "modules",
  name: "Course Module",
  schema: ModuleSchema,
  permissionPrefix: "lms.module",
  createValidation: ModuleValidation.createZodSchema,
  updateValidation: ModuleValidation.updateZodSchema,
  exampleCreate: {
    title: "Module 2: Vector Mathematics and Operations",
    order: 2,
    milestoneId: "cly01mls_term1",
  },
});

// 4. Lessons
registerLmsCrud({
  path: "lessons",
  name: "Course Lesson",
  schema: LessonSchema,
  permissionPrefix: "lms.lesson",
  createValidation: LessonValidation.createZodSchema,
  updateValidation: LessonValidation.updateZodSchema,
  exampleCreate: {
    title: "Lesson 2.1: Dot Product and Applications",
    order: 1,
    durationMinutes: 35,
    moduleId: "cly01mod_vectors",
  },
});

// 5. Lesson Videos + Heartbeat
registerLmsCrud({
  path: "videos",
  name: "Lesson Video",
  schema: LessonVideoSchema,
  permissionPrefix: "lms.lessonVideo",
  createValidation: LessonVideoValidation.createZodSchema,
  updateValidation: LessonVideoValidation.updateZodSchema,
  exampleCreate: {
    lessonId: "cly01lsn_dot_product",
    videoUrl: "https://cdn.education.bd/videos/physics-vec-dot.m3u8",
    durationSeconds: 2100,
    provider: "HLS",
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/lms/videos/:id/heartbeat",
  tag: "LMS",
  summary: "Record video playback heartbeat progress (buffered into Redis)",
  permission: "lms.lessonVideo.read",
  scope: "ASSIGNED",
  operationId: "lmsRecordVideoHeartbeat",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            playedSeconds: z.number().openapi({ example: 420 }),
            totalDuration: z.number().openapi({ example: 2100 }),
            isCompleted: z.boolean().optional().openapi({ example: false }),
          }),
          example: {
            playedSeconds: 420,
            totalDuration: 2100,
            isCompleted: false,
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Heartbeat received and batched into video progress queue",
      content: {
        "application/json": {
          schema: successResponse(z.object({ buffered: z.boolean() }), "Heartbeat recorded"),
        },
      },
    },
  },
});

// 6. Notes
registerLmsCrud({
  path: "notes",
  name: "Lesson Lecture Note",
  schema: LessonNoteSchema,
  permissionPrefix: "lms.lessonNote",
  createValidation: LessonNoteValidation.createZodSchema,
  updateValidation: LessonNoteValidation.updateZodSchema,
  exampleCreate: {
    lessonId: "cly01lsn_dot_product",
    title: "Lecture Notes & Formula Sheet (PDF)",
    fileUrl: "https://cdn.education.bd/notes/vector-formulas.pdf",
  },
});

// 7. Enrollments
registerLmsCrud({
  path: "enrollments",
  name: "Course Enrollment",
  schema: CourseEnrollmentSchema,
  permissionPrefix: "lms.courseEnrollment",
  createValidation: CourseEnrollmentValidation.createZodSchema,
  updateValidation: CourseEnrollmentValidation.updateZodSchema,
  exampleCreate: {
    studentId: "cly01std_rahim2026",
    courseId: "cly01crs_hsc_phys",
  },
});

// 8. Bundles
registerLmsCrud({
  path: "bundles",
  name: "Course Package Bundle",
  schema: BundleSchema,
  permissionPrefix: "lms.bundle",
  createValidation: BundleValidation.createZodSchema,
  updateValidation: BundleValidation.updateZodSchema,
  exampleCreate: {
    title: "HSC Science Trio Bundle (Physics + Chemistry + Math)",
    priceBDT: 9999,
    discountPercent: 25,
  },
});
