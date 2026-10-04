import express from "express";
import { HealthRoutes } from "./health/health.route.js";
import { AuthRoutes } from "./auth/auth.route.js";
import { SaasRoutes } from "./saas/saas.route.js";
import { IdentityRoutes } from "./identity/identity.route.js";
import { PeopleRoutes } from "./people/people.route.js";
import { AcademicRoutes } from "./academic/academic.route.js";
import { AttendanceRoutes } from "./attendance/attendance.route.js";
import { LmsRoutes } from "./lms/lms.route.js";
import { AssessmentRoutes } from "./assessment/assessment.route.js";
import { PlatformRoutes } from "./platform/platform.route.js";

const router = express.Router();

const moduleRoutes = [
  { path: "/health", route: HealthRoutes },
  { path: "/auth", route: AuthRoutes },
  { path: "/saas", route: SaasRoutes },
  { path: "/identity", route: IdentityRoutes },
  { path: "/people", route: PeopleRoutes },
  { path: "/academic", route: AcademicRoutes },
  { path: "/attendance", route: AttendanceRoutes },
  { path: "/lms", route: LmsRoutes },
  { path: "/assessment", route: AssessmentRoutes },
  { path: "/platform", route: PlatformRoutes },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
