import express from "express";
import { HealthController } from "./health.controller.js";

const router = express.Router();

router.get("/", HealthController.getHealthStatus);

export const HealthRoutes = router;
export default HealthRoutes;
