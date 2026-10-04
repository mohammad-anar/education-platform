import express from "express";
import { CourseRoutes } from "./course/course.route.js";
import { MilestoneRoutes } from "./milestone/milestone.route.js";
import { ModuleRoutes } from "./module/module.route.js";
import { LearningItemRoutes } from "./learningItem/learningItem.route.js";
import { LessonRoutes } from "./lesson/lesson.route.js";
import { LessonVideoRoutes } from "./lessonVideo/lessonVideo.route.js";
import { LessonNoteRoutes } from "./lessonNote/lessonNote.route.js";
import { CourseEnrollmentRoutes } from "./courseEnrollment/courseEnrollment.route.js";
import { BundleRoutes } from "./bundle/bundle.route.js";

const router = express.Router();

router.use("/courses", CourseRoutes);
router.use("/milestones", MilestoneRoutes);
router.use("/modules", ModuleRoutes);
router.use("/learning-items", LearningItemRoutes);
router.use("/lessons", LessonRoutes);
router.use("/videos", LessonVideoRoutes);
router.use("/notes", LessonNoteRoutes);
router.use("/enrollments", CourseEnrollmentRoutes);
router.use("/bundles", BundleRoutes);

export const LmsRoutes = router;
export default LmsRoutes;
