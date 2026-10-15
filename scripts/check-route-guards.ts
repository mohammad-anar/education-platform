import routes from "../src/modules/routes.js";
import logger from "../src/utils/logger.js";

// Public route allowlist (exempt from requirePermission guard)
const PUBLIC_ALLOWLIST: RegExp[] = [
  /^\/api\/v1\/health(\/.*)?$/,
  /^\/api\/v1\/auth(\/.*)?$/,
  /^\/uploads(\/.*)?$/,
  /^\/$/,
];

interface IRouteInspection {
  method: string;
  path: string;
  hasPermissionGuard: boolean;
  permissionCode?: string;
  isPublic: boolean;
}

/**
 * Checks if a path matches the public allowlist.
 */
function isPathPublic(fullPath: string): boolean {
  return PUBLIC_ALLOWLIST.some((pattern) => pattern.test(fullPath));
}

/**
 * Inspects all registered routes in a given Express Router.
 */
function inspectRouter(router: any, currentPrefix: string = "/api/v1"): IRouteInspection[] {
  const inspections: IRouteInspection[] = [];
  const stack = router.stack || router._router?.stack || [];

  for (const layer of stack) {
    if (layer.route) {
      const routePath = currentPrefix + (layer.route.path === "/" ? "" : layer.route.path);
      const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());

      // Check if any handler in layer.route.stack is requirePermission
      let hasGuard = false;
      let permissionCode: string | undefined = undefined;

      for (const handlerLayer of layer.route.stack) {
        const fn = handlerLayer.handle;
        if (fn && (fn.__isPermissionGuard || fn.name === "requirePermissionMiddleware" || fn.__permissionCode)) {
          hasGuard = true;
          permissionCode = fn.__permissionCode || (fn.__permissionCodes ? fn.__permissionCodes.join(",") : undefined);
          break;
        }
      }

      const isPublic = isPathPublic(routePath);

      for (const method of methods) {
        inspections.push({
          method,
          path: routePath,
          hasPermissionGuard: hasGuard,
          permissionCode,
          isPublic,
        });
      }
    } else if (layer.name === "router" && layer.handle?.stack) {
      // Find sub-route path prefix if available
      let subPrefix = "";
      // In Express 5, router mount paths can be tracked or inspected
      inspectRouter(layer.handle, currentPrefix);
    }
  }

  return inspections;
}

/**
 * Direct file-level and router introspection to ensure complete coverage across all mounted modules.
 */
async function main() {
  console.log("==================================================");
  console.log("   CI Route Guard Inspection (Step 3 Gatekeeper)   ");
  console.log("==================================================");

  // Load and inspect all module route definitions directly
  const { SaasRoutes } = await import("../src/modules/saas/saas.route.js");
  const { IdentityRoutes } = await import("../src/modules/identity/identity.route.js");
  const { PeopleRoutes } = await import("../src/modules/people/people.route.js");
  const { AcademicRoutes } = await import("../src/modules/academic/academic.route.js");
  const { AttendanceRoutes } = await import("../src/modules/attendance/attendance.route.js");
  const { LmsRoutes } = await import("../src/modules/lms/lms.route.js");
  const { AssessmentRoutes } = await import("../src/modules/assessment/assessment.route.js");
  const { PlatformRoutes } = await import("../src/modules/platform/platform.route.js");
  const { AuthRoutes } = await import("../src/modules/auth/auth.route.js");
  const { HealthRoutes } = await import("../src/modules/health/health.route.js");
  const { DirectoryRoutes } = await import("../src/modules/directory/directory.route.js");
  const { InstitutePublicRoutes } = await import("../src/modules/directory/institute-public.route.js");
  const { StudentPortalRoutes } = await import("../src/modules/student-portal/student-portal.route.js");
  const { SupportRoutes } = await import("../src/modules/support/support.route.js");
  const { DashboardRoutes } = await import("../src/modules/dashboard/dashboard.route.js");
  const { PlatformAdminRoutes } = await import("../src/modules/platform-admin/platform-admin.route.js");
  const { SettingsRoutes } = await import("../src/modules/settings/settings.route.js");

  const moduleRegistry: { prefix: string; router: any; isPublic?: boolean }[] = [
    { prefix: "/api/v1/auth", router: AuthRoutes, isPublic: true },
    { prefix: "/api/v1/health", router: HealthRoutes, isPublic: true },
    { prefix: "/api/v1/saas", router: SaasRoutes },
    { prefix: "/api/v1/identity", router: IdentityRoutes },
    { prefix: "/api/v1/people", router: PeopleRoutes },
    { prefix: "/api/v1/academic", router: AcademicRoutes },
    { prefix: "/api/v1/attendance", router: AttendanceRoutes },
    { prefix: "/api/v1/lms", router: LmsRoutes },
    { prefix: "/api/v1/assessment", router: AssessmentRoutes },
    { prefix: "/api/v1/platform", router: PlatformRoutes },
    { prefix: "/api/v1/directory", router: DirectoryRoutes },
    { prefix: "/api/v1/institute", router: InstitutePublicRoutes },
    { prefix: "/api/v1/student-portal", router: StudentPortalRoutes },
    { prefix: "/api/v1/support", router: SupportRoutes },
    { prefix: "/api/v1/dashboard", router: DashboardRoutes },
    { prefix: "/api/v1/platform-admin", router: PlatformAdminRoutes },
    { prefix: "/api/v1/settings", router: SettingsRoutes },
  ];

  const allInspections: IRouteInspection[] = [];

  for (const mod of moduleRegistry) {
    const modStack = mod.router.stack || [];
    for (const subLayer of modStack) {
      if (subLayer.route) {
        const fullPath = mod.prefix + (subLayer.route.path === "/" ? "" : subLayer.route.path);
        const methods = Object.keys(subLayer.route.methods).map((m) => m.toUpperCase());

        let hasGuard = false;
        let permissionCode: string | undefined = undefined;

        for (const h of subLayer.route.stack) {
          if (h.handle?.__isPermissionGuard) {
            hasGuard = true;
            permissionCode = h.handle.__permissionCode || h.handle.__permissionCodes?.join(",");
            break;
          }
        }

        const isPublic = !!mod.isPublic || isPathPublic(fullPath);

        for (const method of methods) {
          allInspections.push({
            method,
            path: fullPath,
            hasPermissionGuard: hasGuard,
            permissionCode,
            isPublic,
          });
        }
      } else if (subLayer.name === "router" && subLayer.handle?.stack) {
        // Nested subrouter (e.g. /users under /identity)
        // Extract subpath from route configs
        for (const leafLayer of subLayer.handle.stack) {
          if (leafLayer.route) {
            const subPath = leafLayer.route.path === "/" ? "" : leafLayer.route.path;
            const methods = Object.keys(leafLayer.route.methods).map((m) => m.toUpperCase());

            let hasGuard = false;
            let permissionCode: string | undefined = undefined;

            for (const h of leafLayer.route.stack) {
              if (h.handle?.__isPermissionGuard) {
                hasGuard = true;
                permissionCode = h.handle.__permissionCode || h.handle.__permissionCodes?.join(",");
                break;
              }
            }

            for (const method of methods) {
              allInspections.push({
                method,
                path: `${mod.prefix}/*${subPath}`,
                hasPermissionGuard: hasGuard,
                permissionCode,
                isPublic: !!mod.isPublic,
              });
              if (!hasGuard && !mod.isPublic) {
                console.log(`[UNGUARDED DETAIL] ${mod.prefix} -> subLayer: ${subLayer.name}, subPath: ${subPath}, handlers:`, leafLayer.route.stack.map((h: any) => h.handle?.name || h.name));
              }
            }
          }
        }
      }
    }
  }

  const guardedCount = allInspections.filter((r) => r.hasPermissionGuard).length;
  const publicCount = allInspections.filter((r) => r.isPublic).length;
  const violations = allInspections.filter((r) => !r.isPublic && !r.hasPermissionGuard);

  console.log(`Total Inspected Endpoints: ${allInspections.length}`);
  console.log(`Guarded by requirePermission(): ${guardedCount}`);
  console.log(`Public Allowlist Endpoints: ${publicCount}`);

  if (violations.length > 0) {
    console.error(`\n❌ CI FAILURE: Found ${violations.length} unprotected route(s) lacking requirePermission():\n`);
    for (const v of violations) {
      console.error(`  - [${v.method}] ${v.path}`);
    }
    process.exit(1);
  }

  console.log("\n✅ CI SUCCESS: All non-public routes are strictly protected with requirePermission() guards!\n");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error during route guard check:", err);
  process.exit(1);
});
