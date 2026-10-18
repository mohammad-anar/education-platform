import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import { MarkingSchemeValidation } from "../../../modules/assessment/markingScheme/markingScheme.validation.js";
import { AssessmentValidation } from "../../../modules/assessment/assessment/assessment.validation.js";
import { ExamValidation } from "../../../modules/assessment/exam/exam.validation.js";
import { ResultValidation } from "../../../modules/assessment/result/result.validation.js";
import { GradingValidation } from "../../../modules/assessment/grading/grading.validation.js";
import { IdParamSchema } from "../components.js";

const AssessmentSchema = z.object({
  id: z.string().openapi({ example: "cly01asm_quiz1_phy" }),
  title: z.string().openapi({ example: "Physics Chapter 2 - Vectors Class Quiz" }),
  type: z.enum(["QUIZ", "ASSIGNMENT", "EXAM", "PRACTICAL"]).openapi({ example: "QUIZ" }),
  totalMarks: z.number().openapi({ example: 25 }),
  passMarks: z.number().openapi({ example: 10 }),
  dueDate: z.string().openapi({ example: "2026-10-25T23:59:59.000Z" }),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED"]).openapi({ example: "PUBLISHED" }),
});

const ExamSchema = z.object({
  id: z.string().openapi({ example: "cly01exm_midterm_2026" }),
  name: z.string().openapi({ example: "HSC Mid-Term Examination 2026" }),
  academicYearId: z.string().openapi({ example: "cly01yr_2026" }),
  startDate: z.string().openapi({ example: "2026-11-01" }),
  endDate: z.string().openapi({ example: "2026-11-15" }),
  status: z.enum(["SCHEDULED", "ONGOING", "COMPLETED", "PUBLISHED"]).openapi({ example: "SCHEDULED" }),
});

const ResultSchema = z.object({
  id: z.string().openapi({ example: "cly01res_rahim_mid" }),
  studentId: z.string().openapi({ example: "cly01std_rahim2026" }),
  examId: z.string().openapi({ example: "cly01exm_midterm_2026" }),
  totalMarksObtained: z.number().openapi({ example: 88.5 }),
  gpa: z.number().openapi({ example: 5.0 }),
  grade: z.string().openapi({ example: "A+" }),
  status: z.enum(["DRAFT", "PUBLISHED", "WITHHELD"]).openapi({ example: "PUBLISHED" }),
});

const GradingSystemSchema = z.object({
  id: z.string().openapi({ example: "cly01grd_nctb" }),
  name: z.string().openapi({ example: "NCTB Standard GPA 5.0 Grading System" }),
  rules: z.array(
    z.object({
      minMarks: z.number().openapi({ example: 80 }),
      maxMarks: z.number().openapi({ example: 100 }),
      grade: z.string().openapi({ example: "A+" }),
      gradePoint: z.number().openapi({ example: 5.0 }),
    })
  ),
});

// 1. Assessments CRUD
registerRoute({
  method: "get",
  path: "/api/v1/assessment/assessments",
  tag: "Assessment",
  summary: "List quizzes and assignments",
  permission: "assessment.assessment.read",
  scope: "INSTITUTE",
  operationId: "assessmentListAssessments",
  responses: {
    200: {
      description: "List of assessments",
      content: {
        "application/json": {
          schema: paginated(AssessmentSchema, "Assessments retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/assessment/assessments",
  tag: "Assessment",
  summary: "Create new quiz or assignment",
  permission: "assessment.assessment.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "assessmentCreateAssessment",
  request: {
    body: {
      content: {
        "application/json": {
          schema: AssessmentValidation.createZodSchema,
          example: {
            title: "Physics Chapter 2 - Vectors Class Quiz",
            type: "QUIZ",
            totalMarks: 25,
            passMarks: 10,
            dueDate: "2026-10-25T23:59:59.000Z",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Assessment created",
      content: {
        "application/json": {
          schema: successResponse(AssessmentSchema, "Assessment created"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/assessment/assessments/:id/submit-quiz",
  tag: "Assessment",
  summary: "Student submit online quiz answers",
  permission: "assessment.assessment.read",
  scope: "ASSIGNED",
  operationId: "assessmentSubmitQuiz",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            answers: z.array(
              z.object({
                questionId: z.string().openapi({ example: "cly01qst_01" }),
                selectedOption: z.string().openapi({ example: "B" }),
              })
            ),
          }),
          example: {
            answers: [
              { questionId: "cly01qst_01", selectedOption: "B" },
              { questionId: "cly01qst_02", selectedOption: "D" },
            ],
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Quiz submitted and auto-graded (quiz_submitted event emitted)",
      content: {
        "application/json": {
          schema: successResponse(
            z.object({
              score: z.number().openapi({ example: 22 }),
              totalMarks: z.number().openapi({ example: 25 }),
              passed: z.boolean().openapi({ example: true }),
            }),
            "Quiz scored"
          ),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/assessment/assessments/:id/submit-assignment",
  tag: "Assessment",
  summary: "Student submit homework assignment document",
  permission: "assessment.assessment.read",
  scope: "ASSIGNED",
  operationId: "assessmentSubmitAssignment",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            fileUrl: z.string().url().openapi({ example: "https://cdn.education.bd/submissions/rahim-physics-hw1.pdf" }),
            notes: z.string().optional().openapi({ example: "Vector calculus problem solutions included on page 3" }),
          }),
          example: {
            fileUrl: "https://cdn.education.bd/submissions/rahim-physics-hw1.pdf",
            notes: "Vector calculus problem solutions included on page 3",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Assignment submission received (assignment_submitted event emitted)",
      content: {
        "application/json": {
          schema: successResponse(z.object({ submitted: z.boolean() }), "Assignment submitted"),
        },
      },
    },
  },
});

// 2. Exams & Marks
registerRoute({
  method: "get",
  path: "/api/v1/assessment/exams",
  tag: "Assessment",
  summary: "List institutional term examinations",
  permission: "assessment.exam.read",
  scope: "INSTITUTE",
  operationId: "assessmentListExams",
  responses: {
    200: {
      description: "Exam list",
      content: {
        "application/json": {
          schema: paginated(ExamSchema, "Exams retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/assessment/exams",
  tag: "Assessment",
  summary: "Schedule institutional term examination",
  permission: "assessment.exam.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "assessmentCreateExam",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ExamValidation.createZodSchema,
          example: {
            name: "HSC Mid-Term Examination 2026",
            academicYearId: "cly01yr_2026",
            startDate: "2026-11-01",
            endDate: "2026-11-15",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Exam scheduled",
      content: {
        "application/json": {
          schema: successResponse(ExamSchema, "Exam created"),
        },
      },
    },
  },
});

// 3. Results & Overrides
registerRoute({
  method: "get",
  path: "/api/v1/assessment/results",
  tag: "Assessment",
  summary: "List computed examination grade sheets and results",
  permission: "assessment.result.read",
  scope: "INSTITUTE",
  operationId: "assessmentListResults",
  responses: {
    200: {
      description: "Results list",
      content: {
        "application/json": {
          schema: paginated(ResultSchema, "Results retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/assessment/results/:id/publish",
  tag: "Assessment",
  summary: "Publish official final results to student and guardian portals",
  permission: "assessment.result.publish",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "assessmentPublishResult",
  request: { params: IdParamSchema },
  responses: {
    200: {
      description: "Result published (result_published event emitted)",
      content: {
        "application/json": {
          schema: successResponse(z.object({ published: z.boolean() }), "Result published"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/assessment/results/:id/override",
  tag: "Assessment",
  summary: "Head Examiner score override and grade modification",
  permission: "assessment.result.override",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "assessmentOverrideResult",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: z.object({
            marksObtained: z.number().openapi({ example: 82 }),
            reason: z.string().openapi({ example: "Re-check approved by Academic Council for Question 4" }),
          }),
          example: {
            marksObtained: 82,
            reason: "Re-check approved by Academic Council for Question 4",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Score updated and logged into audit trail",
      content: {
        "application/json": {
          schema: successResponse(ResultSchema, "Score overridden successfully"),
        },
      },
    },
  },
});

// 4. Grading Systems
registerRoute({
  method: "get",
  path: "/api/v1/assessment/grading-systems",
  tag: "Assessment",
  summary: "List institutional grading scales (e.g. GPA 5.0, CGPA 4.0)",
  permission: "assessment.grading.read",
  scope: "INSTITUTE",
  operationId: "assessmentListGradingSystems",
  responses: {
    200: {
      description: "Grading scales list",
      content: {
        "application/json": {
          schema: paginated(GradingSystemSchema, "Grading scales retrieved"),
        },
      },
    },
  },
});

registerRoute({
  method: "post",
  path: "/api/v1/assessment/grading-systems",
  tag: "Assessment",
  summary: "Define new grading scale",
  permission: "assessment.grading.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "assessmentCreateGradingSystem",
  request: {
    body: {
      content: {
        "application/json": {
          schema: GradingValidation.createZodSchema,
          example: {
            name: "NCTB Standard GPA 5.0 Grading System",
            rules: [
              { minMarks: 80, maxMarks: 100, grade: "A+", gradePoint: 5.0 },
              { minMarks: 70, maxMarks: 79, grade: "A", gradePoint: 4.0 },
              { minMarks: 60, maxMarks: 69, grade: "A-", gradePoint: 3.5 },
            ],
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Grading system created",
      content: {
        "application/json": {
          schema: successResponse(GradingSystemSchema, "Grading scale created"),
        },
      },
    },
  },
});
