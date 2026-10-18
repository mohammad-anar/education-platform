import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry.js";
import env from "../../config/env.js";

// Import all module route documentations so they register themselves into the registry
import "./modules/index.js";

export function generateOpenAPIDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const serverUrl = env.node_env === "production" 
    ? (env.frontend_url || "https://api.education-platform.com")
    : `http://localhost:${env.port}`;

  const doc = generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Multi-Tenant Education Platform API",
      version: "1.0.0",
      description: `
## Overview
Welcome to the Comprehensive API Documentation for the Multi-Tenant Education & LMS Platform.

### Authentication & Automated Headers
1. **Automatic Swagger Login:** Simply execute \`POST /api/v1/auth/login\` directly in Swagger UI. The access token and tenant ID are **automatically captured, persisted in local storage, and applied to all 347 routes** without copy-pasting.
2. **Authorize Modal:** Click the **Authorize** button at the top right to view or manage credentials:
   - \`bearerAuth\`: JWT Access Token (auto-prefixed with \`Bearer \`).
   - \`tenantAuth\`: Active Multi-Tenant Institute ID (\`X-Institute-Id\`).
3. **Multi-Tenant Header (X-Institute-Id):** Every route now includes the \`X-Institute-Id\` header parameter so you can test individual routes with different institute contexts or rely on the global auto-injected active tenant.
4. **Interactive Multi-Tenant Toolbar:** Use the top control bar to switch tenant presets (e.g. Dhaka College, Chittagong High) or trigger 1-Click Demo Login with zero typing.

### Standard Envelopes
- **Success Envelope:**
  \`\`\`json
  {
    "success": true,
    "statusCode": 200,
    "message": "Operation description",
    "data": { ... },
    "meta": { "page": 1, "limit": 10, "total": 100, "totalPage": 10 }
  }
  \`\`\`
- **Error Envelope:**
  \`\`\`json
  {
    "success": false,
    "message": "Validation Error / Record Not Found",
    "errorMessages": [
      { "path": "fieldName", "message": "Detailed error reason" }
    ]
  }
  \`\`\`

### Vendor Extensions
- \`x-permission\`: Exact permission code checked by \`requirePermission()\` guard.
- \`x-scope\`: Enforcement scope level (\`OWN\`, \`ASSIGNED\`, \`INSTITUTE\`, \`ALL\`).
- \`x-audit-logged\`: Indicates that the mutation writes a permanent row in the \`AuditLog\` table.
      `,
      contact: {
        name: "API Support",
        email: "support@education-platform.com",
      },
    },
    servers: [
      {
        url: serverUrl,
        description: `${env.node_env.toUpperCase()} Environment Server`,
      },
    ],
    security: [
      {
        bearerAuth: [],
        tenantAuth: [],
      },
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: "Health", description: "System health check & diagnostics" },
      { name: "Auth", description: "Authentication, JWT tokens, OTP, and session lifecycle" },
      { name: "SaaS", description: "Tenant institutes, subscriptions, and quotas" },
      { name: "Identity", description: "Users, RBAC roles, permission catalog, overrides, and matrices" },
      { name: "People", description: "Students, Teachers, Staff, Guardians, and self-service profiles" },
      { name: "Directory", description: "Public institute profiles, teacher directory, and contact visibility" },
      { name: "Academic", description: "Academic years, programs, levels, classes, sections, subjects, and enrollments" },
      { name: "Attendance", description: "Weighted policies, calendar exceptions, sessions, timetable routines, and live classes" },
      { name: "LMS", description: "Courses, milestones, modules, learning items, lessons, videos, notes, enrollments, and bundles" },
      { name: "Assessment", description: "Marking schemes, assignments, quizzes, exams, score overrides, and grading systems" },
      { name: "Platform", description: "Targeted notice boards, read tracking, notifications, file assets, and certificates" },
      { name: "Student Portal", description: "Aggregated student routines, attendance stats, overdue tasks, and progress" },
      { name: "Role Dashboards", description: "Aggregated KPI dashboards for Teachers, Admins, and Guardians" },
      { name: "Support System", description: "Support tickets, real-time messaging, appointment slots, and live support sessions" },
      { name: "Platform Admin", description: "Multi-tenant owner console, MRR/ARR KPIs, plan enforcement, and impersonation" },
      { name: "Settings", description: "User preferences, 2FA setup, active sessions, and validated institute settings" },
    ],
  });

  return doc;
}

export default generateOpenAPIDocument;
