import express from "express";
import { PolicyRoutes } from "./policy/policy.route.js";
import { CalendarRoutes } from "./calendar/calendar.route.js";
import { SessionRoutes } from "./session/session.route.js";
import { RoutineRoutes } from "./routine/routine.route.js";
import { LiveClassRoutes } from "./liveClass/liveClass.route.js";

const router = express.Router();

router.use("/policies", PolicyRoutes);
router.use("/calendars", CalendarRoutes);
router.use("/sessions", SessionRoutes);
router.use("/routines", RoutineRoutes);
router.use("/live-classes", LiveClassRoutes);

export const AttendanceRoutes = router;
export default AttendanceRoutes;
