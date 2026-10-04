import express from "express";
import { StudentRoutes } from "./student/student.route.js";
import { GuardianRoutes } from "./guardian/guardian.route.js";
import { TeacherRoutes } from "./teacher/teacher.route.js";
import { StaffRoutes } from "./staff/staff.route.js";

const router = express.Router();

router.use("/students", StudentRoutes);
router.use("/guardians", GuardianRoutes);
router.use("/teachers", TeacherRoutes);
router.use("/staff", StaffRoutes);

export const PeopleRoutes = router;
export default PeopleRoutes;
