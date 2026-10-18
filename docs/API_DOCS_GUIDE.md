# API Documentation Guide (OpenAPI 3.0 & Swagger UI)

This guide documents the architecture, principles, and maintenance workflow for the Multi-Tenant Education & LMS Platform API documentation.

---

## 1. Architecture Overview

- **Source of Truth:** Real runtime Zod validation schemas (`*.validation.ts`) and route permission configurations (`requirePermission(...)`).
- **Generator:** `@asteasolutions/zod-to-openapi` registers schemas and paths into a unified `OpenAPIRegistry`.
- **Live Swagger UI:** Mounted at `/api/docs` (with `/docs` redirecting automatically).
- **JSON Specification:** Available at `/api/docs/openapi.json`.
- **Offline Exports:** Available as `docs/openapi.json` and `docs/openapi.yaml`.

---

## 2. Standard 5-Step Workflow for Documenting a New Endpoint

When adding a new route under `/api/v1`, follow these 5 steps:

### Step 1: Define Zod Validation Schema
In your module's `*.validation.ts` file, write your Zod schema:
```ts
const createZodSchema = z.object({
  title: z.string().min(1, "Title is required"),
  code: z.string().min(1, "Code is required"),
});
```

### Step 2: Register Route in `src/docs/openapi/modules/<module>.ts`
Import `registerRoute`, `successResponse`, and your validation schema:
```ts
registerRoute({
  method: "post",
  path: "/api/v1/academic/programs",
  tag: "Academic",
  summary: "Create new academic program",
  permission: "academic.program.create",
  scope: "INSTITUTE",
  auditLogged: true,
  operationId: "academicCreateProgram",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ProgramValidation.createZodSchema,
          example: {
            title: "HSC Science 2026",
            code: "HSC-SCI",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Program created successfully",
      content: {
        "application/json": {
          schema: successResponse(ProgramEntitySchema, "Program created"),
        },
      },
    },
  },
});
```

### Step 3: Run Validation & Test
Verify that the generated OpenAPI document adheres to OpenAPI 3.0 standards and that operation IDs are unique:
```bash
pnpm test src/docs/openapi/openapi.test.ts
```

### Step 4: Export Spec Files
Export updated JSON and YAML specs:
```bash
pnpm run docs:export
```

### Step 5: Verify in Swagger UI
Open `http://localhost:5000/api/docs` in your browser and test the endpoint using the interactive "Try it out" feature.

---

## 3. Bangladesh Context Conventions
- Currency: **BDT (৳)**
- Timezone: **Asia/Dhaka (UTC+6)**
- Names: Authentic Bangladeshi names (e.g., Rahim Uddin, Mohammad Hasan, Abul Kalam)
- Phone Numbers: E.164 format with Bangladeshi prefix: `+88017XXXXXXXX`, `+88018XXXXXXXX`
