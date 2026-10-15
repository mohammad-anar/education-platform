import fs from "fs";
import path from "path";

interface IRouteDef {
  method: string;
  path: string;
  routerFile: string;
  validateSchema: string;
  requirePermission: string;
  isPublic: boolean;
}

const ROUTE_FILE_MAPPINGS: { filePath: string; baseMount: string; isPublicModule?: boolean }[] = [
  // Health & Auth
  { filePath: "src/modules/health/health.route.ts", baseMount: "/api/v1/health", isPublicModule: true },
  { filePath: "src/modules/auth/auth.route.ts", baseMount: "/api/v1/auth", isPublicModule: true },

  // SaaS
  { filePath: "src/modules/saas/institute/institute.route.ts", baseMount: "/api/v1/saas/institutes" },
  { filePath: "src/modules/saas/subscription/subscription.route.ts", baseMount: "/api/v1/saas/subscriptions" },

  // Identity
  { filePath: "src/modules/identity/user/user.route.ts", baseMount: "/api/v1/identity/users" },
  { filePath: "src/modules/identity/role/role.route.ts", baseMount: "/api/v1/identity/roles" },
  { filePath: "src/modules/identity/permission/permission.route.ts", baseMount: "/api/v1/identity/permissions" },

  // People
  { filePath: "src/modules/people/student/student.route.ts", baseMount: "/api/v1/people/students" },
  { filePath: "src/modules/people/teacher/teacher.route.ts", baseMount: "/api/v1/people/teachers" },
  { filePath: "src/modules/people/staff/staff.route.ts", baseMount: "/api/v1/people/staff" },
  { filePath: "src/modules/people/guardian/guardian.route.ts", baseMount: "/api/v1/people/guardians" },

  // Academic
  { filePath: "src/modules/academic/academicYear/academicYear.route.ts", baseMount: "/api/v1/academic/years" },
  { filePath: "src/modules/academic/program/program.route.ts", baseMount: "/api/v1/academic/programs" },
  { filePath: "src/modules/academic/level/level.route.ts", baseMount: "/api/v1/academic/levels" },
  { filePath: "src/modules/academic/classGroup/classGroup.route.ts", baseMount: "/api/v1/academic/classes" },
  { filePath: "src/modules/academic/section/section.route.ts", baseMount: "/api/v1/academic/sections" },
  { filePath: "src/modules/academic/subject/subject.route.ts", baseMount: "/api/v1/academic/subjects" },
  { filePath: "src/modules/academic/enrollment/enrollment.route.ts", baseMount: "/api/v1/academic/enrollments" },

  // Attendance
  { filePath: "src/modules/attendance/policy/policy.route.ts", baseMount: "/api/v1/attendance/policies" },
  { filePath: "src/modules/attendance/calendar/calendar.route.ts", baseMount: "/api/v1/attendance/calendars" },
  { filePath: "src/modules/attendance/session/session.route.ts", baseMount: "/api/v1/attendance/sessions" },
  { filePath: "src/modules/attendance/routine/routine.route.ts", baseMount: "/api/v1/attendance/routines" },
  { filePath: "src/modules/attendance/liveClass/liveClass.route.ts", baseMount: "/api/v1/attendance/live-classes" },

  // LMS
  { filePath: "src/modules/lms/course/course.route.ts", baseMount: "/api/v1/lms/courses" },
  { filePath: "src/modules/lms/milestone/milestone.route.ts", baseMount: "/api/v1/lms/milestones" },
  { filePath: "src/modules/lms/module/module.route.ts", baseMount: "/api/v1/lms/modules" },
  { filePath: "src/modules/lms/learningItem/learningItem.route.ts", baseMount: "/api/v1/lms/learning-items" },
  { filePath: "src/modules/lms/lesson/lesson.route.ts", baseMount: "/api/v1/lms/lessons" },
  { filePath: "src/modules/lms/lessonVideo/lessonVideo.route.ts", baseMount: "/api/v1/lms/videos" },
  { filePath: "src/modules/lms/lessonNote/lessonNote.route.ts", baseMount: "/api/v1/lms/notes" },
  { filePath: "src/modules/lms/courseEnrollment/courseEnrollment.route.ts", baseMount: "/api/v1/lms/enrollments" },
  { filePath: "src/modules/lms/bundle/bundle.route.ts", baseMount: "/api/v1/lms/bundles" },

  // Assessment
  { filePath: "src/modules/assessment/markingScheme/markingScheme.route.ts", baseMount: "/api/v1/assessment/marking-schemes" },
  { filePath: "src/modules/assessment/assessment/assessment.route.ts", baseMount: "/api/v1/assessment/assessments" },
  { filePath: "src/modules/assessment/exam/exam.route.ts", baseMount: "/api/v1/assessment/exams" },
  { filePath: "src/modules/assessment/result/result.route.ts", baseMount: "/api/v1/assessment/results" },
  { filePath: "src/modules/assessment/grading/grading.route.ts", baseMount: "/api/v1/assessment/grading-systems" },

  // Platform
  { filePath: "src/modules/platform/notice/notice.route.ts", baseMount: "/api/v1/platform/notices" },
  { filePath: "src/modules/platform/notification/notification.route.ts", baseMount: "/api/v1/platform/notifications" },
  { filePath: "src/modules/platform/file/file.route.ts", baseMount: "/api/v1/platform/files" },
  { filePath: "src/modules/platform/certificate/certificate.route.ts", baseMount: "/api/v1/platform/certificates" },

  // Directory & Institute Public
  { filePath: "src/modules/directory/directory.route.ts", baseMount: "/api/v1/directory" },
  { filePath: "src/modules/directory/institute-public.route.ts", baseMount: "/api/v1/institute" },

  // Student Portal
  { filePath: "src/modules/student-portal/student-portal.route.ts", baseMount: "/api/v1/student-portal" },

  // Support System
  { filePath: "src/modules/support/support.route.ts", baseMount: "/api/v1/support" },

  // Role Dashboards
  { filePath: "src/modules/dashboard/dashboard.route.ts", baseMount: "/api/v1/dashboard" },

  // Platform Admin
  { filePath: "src/modules/platform-admin/platform-admin.route.ts", baseMount: "/api/v1/platform-admin" },

  // Settings
  { filePath: "src/modules/settings/settings.route.ts", baseMount: "/api/v1/settings" },
];

function parseRouteFile(filePath: string, baseMount: string, isPublicModule: boolean): IRouteDef[] {
  const content = fs.readFileSync(filePath, "utf8");
  const routes: IRouteDef[] = [];

  // Match router.<method>(...) calls
  // Need to handle multi-line router calls
  // Regex to find router.(get|post|patch|put|delete)(...) blocks
  const routerCallRegex = /router\.(get|post|patch|put|delete)\s*\(\s*(["'`][^"'`]+["'`]|['"`]\/['"`])([\s\S]*?)(?=\n\s*(?:router\.(?:get|post|patch|put|delete|use)|export|$))/g;

  let match;
  while ((match = routerCallRegex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const rawSubPath = match[2].replace(/["'`]/g, "");
    const argsBlock = match[3];

    const fullPath = baseMount + (rawSubPath === "/" ? "" : rawSubPath);

    // Extract validateRequest schema
    let validateSchema = "None";
    const validateMatch = argsBlock.match(/validateRequest\s*\(\s*([^,\)]+)/);
    if (validateMatch) {
      validateSchema = validateMatch[1].trim();
    } else {
      const validateInlineMatch = argsBlock.match(/validate\s*\(\s*([^,\)]+)/);
      if (validateInlineMatch) {
        validateSchema = validateInlineMatch[1].trim();
      }
    }

    // Extract requirePermission
    let permCode = "None";
    const permMatch = argsBlock.match(/requirePermission\s*\(\s*["']([^"']+)["']/);
    if (permMatch) {
      permCode = permMatch[1];
    }

    // Is public?
    let isPublic = false;
    if (isPublicModule && fullPath.startsWith("/api/v1/auth")) {
      // /api/v1/auth has some routes that require auth() like logout, change-password, me
      if (argsBlock.includes("auth()") || argsBlock.includes("requirePermission")) {
        isPublic = false;
      } else {
        isPublic = true;
      }
    } else if (isPublicModule && fullPath.startsWith("/api/v1/health")) {
      isPublic = true;
    }

    routes.push({
      method,
      path: fullPath,
      routerFile: filePath.replace(/\\/g, "/"),
      validateSchema,
      requirePermission: permCode,
      isPublic,
    });
  }

  return routes;
}

function main() {
  const allRoutes: IRouteDef[] = [];

  for (const config of ROUTE_FILE_MAPPINGS) {
    const fileRoutes = parseRouteFile(config.filePath, config.baseMount, !!config.isPublicModule);
    allRoutes.push(...fileRoutes);
  }

  console.log(`Parsed total routes: ${allRoutes.length}`);

  // Sort routes by path, then method
  allRoutes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

  // Identify routes with no Zod schema
  const noSchemaRoutes = allRoutes.filter((r) => r.validateSchema === "None");
  const withSchemaRoutes = allRoutes.filter((r) => r.validateSchema !== "None");

  console.log(`Routes with Zod schema: ${withSchemaRoutes.length}`);
  console.log(`Routes with NO Zod schema: ${noSchemaRoutes.length}`);

  // Build docs/openapi-route-inventory.md
  let md = `# OpenAPI Route Inventory\n\n`;
  md += `> Comprehensive inventory of all routes under \`/api/v1\`, capturing HTTP methods, endpoint paths, request validation schemas, permission codes, access level (public vs protected), and router source files.\n\n`;
  md += `## 1. Summary Metrics\n\n`;
  md += `- **Total Registered Routes:** ${allRoutes.length}\n`;
  md += `- **Routes with Active Zod Schema Middleware:** ${withSchemaRoutes.length}\n`;
  md += `- **Routes with No Zod Schema Middleware:** ${noSchemaRoutes.length}\n`;
  md += `- **Public Routes:** ${allRoutes.filter((r) => r.isPublic).length}\n`;
  md += `- **Protected Routes:** ${allRoutes.filter((r) => !r.isPublic).length}\n\n`;

  md += `## 2. Complete Route Inventory Table\n\n`;
  md += `| # | Method | Path | Validate Schema | Permission Guard | Access | Router File |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  allRoutes.forEach((r, idx) => {
    const accessBadge = r.isPublic ? "🟢 Public" : "🔒 Protected";
    const schemaDisplay = r.validateSchema === "None" ? "*None*" : `\`${r.validateSchema}\``;
    const permDisplay = r.requirePermission === "None" ? (r.isPublic ? "*Public*" : "*auth()*") : `\`${r.requirePermission}\``;
    md += `| ${idx + 1} | \`${r.method}\` | \`${r.path}\` | ${schemaDisplay} | ${permDisplay} | ${accessBadge} | \`${r.routerFile}\` |\n`;
  });

  md += `\n## 3. Routes with No Zod Schema (${noSchemaRoutes.length} endpoints)\n\n`;
  md += `These routes currently lack \`validateRequest(...)\` middleware (typically \`GET\` collection queries, ID lookup params, or parameter-free actions). To provide 100% complete OpenAPI documentation, request parameter/query/body Zod schemas or response-only documentation must be registered for each:\n\n`;
  md += `| Method | Path | Permission | Router File |\n`;
  md += `| :--- | :--- | :--- | :--- |\n`;

  noSchemaRoutes.forEach((r) => {
    md += `| \`${r.method}\` | \`${r.path}\` | \`${r.requirePermission}\` | \`${r.routerFile}\` |\n`;
  });

  if (!fs.existsSync("docs")) {
    fs.mkdirSync("docs", { recursive: true });
  }

  fs.writeFileSync("docs/openapi-route-inventory.md", md, "utf8");
  console.log("Written docs/openapi-route-inventory.md successfully.");
}

main();
