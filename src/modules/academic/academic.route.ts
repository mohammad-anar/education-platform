import express from "express";
import { AcademicYearRoutes } from "./academicYear/academicYear.route.js";
import { ProgramRoutes } from "./program/program.route.js";
import { LevelRoutes } from "./level/level.route.js";
import { ClassGroupRoutes } from "./classGroup/classGroup.route.js";
import { SectionRoutes } from "./section/section.route.js";
import { SubjectRoutes } from "./subject/subject.route.js";
import { EnrollmentRoutes } from "./enrollment/enrollment.route.js";

const router = express.Router();

router.use("/years", AcademicYearRoutes);
router.use("/programs", ProgramRoutes);
router.use("/levels", LevelRoutes);
router.use("/classes", ClassGroupRoutes);
router.use("/sections", SectionRoutes);
router.use("/subjects", SubjectRoutes);
router.use("/enrollments", EnrollmentRoutes);

export const AcademicRoutes = router;
export default AcademicRoutes;
