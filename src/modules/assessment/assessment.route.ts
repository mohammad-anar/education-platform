import express from "express";
import { MarkingSchemeRoutes } from "./markingScheme/markingScheme.route.js";
import { AssessmentRoutes as SingleAssessmentRoutes } from "./assessment/assessment.route.js";
import { ExamRoutes } from "./exam/exam.route.js";
import { ResultRoutes } from "./result/result.route.js";
import { GradingRoutes } from "./grading/grading.route.js";

const router = express.Router();

router.use("/marking-schemes", MarkingSchemeRoutes);
router.use("/assessments", SingleAssessmentRoutes);
router.use("/exams", ExamRoutes);
router.use("/results", ResultRoutes);
router.use("/grading-systems", GradingRoutes);

export const AssessmentRoutes = router;
export default AssessmentRoutes;
