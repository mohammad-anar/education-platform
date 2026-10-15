import fs from "fs";
import {
  PERMISSION_CATALOG,
  PermissionScope,
  buildPermissionCatalog,
} from "../src/modules/identity/permission-engine/permission-catalog.js";

buildPermissionCatalog();

const catalogMap = new Map<string, { defaultScope: PermissionScope; description: string }>();
for (const p of PERMISSION_CATALOG) {
  catalogMap.set(p.code, { defaultScope: p.defaultScope, description: p.description });
}

interface IRouteFileConfig {
  filePath: string;
  baseMountPath: string;
}

const ROUTE_CONFIGS: IRouteFileConfig[] = [
  // SAAS
  { filePath: "src/modules/saas/institute/institute.route.ts", baseMountPath: "/api/v1/saas/institutes" },
  { filePath: "src/modules/saas/subscription/subscription.route.ts", baseMountPath: "/api/v1/saas/subscriptions" },

  // IDENTITY
  { filePath: "src/modules/identity/user/user.route.ts", baseMountPath: "/api/v1/identity/users" },
  { filePath: "src/modules/identity/role/role.route.ts", baseMountPath: "/api/v1/identity/roles" },
  { filePath: "src/modules/identity/permission/permission.route.ts", baseMountPath: "/api/v1/identity/permissions" },

  // PEOPLE
  { filePath: "src/modules/people/student/student.route.ts", baseMountPath: "/api/v1/people/students" },
  { filePath: "src/modules/people/teacher/teacher.route.ts", baseMountPath: "/api/v1/people/teachers" },
  { filePath: "src/modules/people/staff/staff.route.ts", baseMountPath: "/api/v1/people/staff" },
  { filePath: "src/modules/people/guardian/guardian.route.ts", baseMountPath: "/api/v1/people/guardians" },

  // ACADEMIC
  { filePath: "src/modules/academic/academicYear/academicYear.route.ts", baseMountPath: "/api/v1/academic/years" },
  { filePath: "src/modules/academic/program/program.route.ts", baseMountPath: "/api/v1/academic/programs" },
  { filePath: "src/modules/academic/level/level.route.ts", baseMountPath: "/api/v1/academic/levels" },
  { filePath: "src/modules/academic/classGroup/classGroup.route.ts", baseMountPath: "/api/v1/academic/classes" },
  { filePath: "src/modules/academic/section/section.route.ts", baseMountPath: "/api/v1/academic/sections" },
  { filePath: "src/modules/academic/subject/subject.route.ts", baseMountPath: "/api/v1/academic/subjects" },
  { filePath: "src/modules/academic/enrollment/enrollment.route.ts", baseMountPath: "/api/v1/academic/enrollments" },

  // ATTENDANCE
  { filePath: "src/modules/attendance/policy/policy.route.ts", baseMountPath: "/api/v1/attendance/policies" },
  { filePath: "src/modules/attendance/calendar/calendar.route.ts", baseMountPath: "/api/v1/attendance/calendars" },
  { filePath: "src/modules/attendance/session/session.route.ts", baseMountPath: "/api/v1/attendance/sessions" },
  { filePath: "src/modules/attendance/routine/routine.route.ts", baseMountPath: "/api/v1/attendance/routines" },
  { filePath: "src/modules/attendance/liveClass/liveClass.route.ts", baseMountPath: "/api/v1/attendance/live-classes" },

  // LMS
  { filePath: "src/modules/lms/course/course.route.ts", baseMountPath: "/api/v1/lms/courses" },
  { filePath: "src/modules/lms/milestone/milestone.route.ts", baseMountPath: "/api/v1/lms/milestones" },
  { filePath: "src/modules/lms/module/module.route.ts", baseMountPath: "/api/v1/lms/modules" },
  { filePath: "src/modules/lms/learningItem/learningItem.route.ts", baseMountPath: "/api/v1/lms/learning-items" },
  { filePath: "src/modules/lms/lesson/lesson.route.ts", baseMountPath: "/api/v1/lms/lessons" },
  { filePath: "src/modules/lms/lessonVideo/lessonVideo.route.ts", baseMountPath: "/api/v1/lms/videos" },
  { filePath: "src/modules/lms/lessonNote/lessonNote.route.ts", baseMountPath: "/api/v1/lms/notes" },
  { filePath: "src/modules/lms/courseEnrollment/courseEnrollment.route.ts", baseMountPath: "/api/v1/lms/enrollments" },
  { filePath: "src/modules/lms/bundle/bundle.route.ts", baseMountPath: "/api/v1/lms/bundles" },

  // ASSESSMENT
  { filePath: "src/modules/assessment/markingScheme/markingScheme.route.ts", baseMountPath: "/api/v1/assessment/marking-schemes" },
  { filePath: "src/modules/assessment/assessment/assessment.route.ts", baseMountPath: "/api/v1/assessment/assessments" },
  { filePath: "src/modules/assessment/exam/exam.route.ts", baseMountPath: "/api/v1/assessment/exams" },
  { filePath: "src/modules/assessment/result/result.route.ts", baseMountPath: "/api/v1/assessment/results" },
  { filePath: "src/modules/assessment/grading/grading.route.ts", baseMountPath: "/api/v1/assessment/grading-systems" },

  // PLATFORM
  { filePath: "src/modules/platform/notice/notice.route.ts", baseMountPath: "/api/v1/platform/notices" },
  { filePath: "src/modules/platform/notification/notification.route.ts", baseMountPath: "/api/v1/platform/notifications" },
  { filePath: "src/modules/platform/file/file.route.ts", baseMountPath: "/api/v1/platform/files" },
  { filePath: "src/modules/platform/certificate/certificate.route.ts", baseMountPath: "/api/v1/platform/certificates" },

  // DIRECTORY & VISIBILITY
  { filePath: "src/modules/directory/directory.route.ts", baseMountPath: "/api/v1/directory" },
  { filePath: "src/modules/directory/institute-public.route.ts", baseMountPath: "/api/v1/institute" },

  // STUDENT PORTAL
  { filePath: "src/modules/student-portal/student-portal.route.ts", baseMountPath: "/api/v1/student-portal" },

  // SUPPORT SYSTEM
  { filePath: "src/modules/support/support.route.ts", baseMountPath: "/api/v1/support" },

  // ROLE DASHBOARDS
  { filePath: "src/modules/dashboard/dashboard.route.ts", baseMountPath: "/api/v1/dashboard" },

  // PLATFORM ADMIN CONSOLE
  { filePath: "src/modules/platform-admin/platform-admin.route.ts", baseMountPath: "/api/v1/platform-admin" },

  // SETTINGS & PREFERENCES
  { filePath: "src/modules/settings/settings.route.ts", baseMountPath: "/api/v1/settings" },
];

interface IRouteMappingEntry {
  method: string;
  path: string;
  permission: string;
  defaultScope: string;
}

const routeMapEntries: IRouteMappingEntry[] = [];

for (const config of ROUTE_CONFIGS) {
  const content = fs.readFileSync(config.filePath, "utf8");

  const regex = /router\.(get|post|patch|put|delete)\s*\(\s*["']([^"']+)["'],\s*requirePermission\(["']([^"']+)["']\)/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const method = match[1].toUpperCase();
    const subPath = match[2];
    const permCode = match[3];

    const fullPath = config.baseMountPath + (subPath === "/" ? "" : subPath);
    const cat = catalogMap.get(permCode);

    routeMapEntries.push({
      method,
      path: fullPath,
      permission: permCode,
      defaultScope: cat?.defaultScope || "INSTITUTE",
    });
  }
}

// Generate docs/route-permission-map.md
let docContent = `# Route Permission Map\n\n`;
docContent += `> Comprehensive mapping of every protected route in the system to its required permission code and default scope.\n\n`;
docContent += `**Total Protected Routes:** ${routeMapEntries.length}\n\n`;
docContent += `| Method | Path | Permission | Default Scope |\n`;
docContent += `| :--- | :--- | :--- | :--- |\n`;

// Sort by path, then method
routeMapEntries.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

for (const entry of routeMapEntries) {
  docContent += `| \`${entry.method}\` | \`${entry.path}\` | \`${entry.permission}\` | \`${entry.defaultScope}\` |\n`;
}

fs.writeFileSync("docs/route-permission-map.md", docContent, "utf8");
console.log(`Generated docs/route-permission-map.md with ${routeMapEntries.length} routes.`);
