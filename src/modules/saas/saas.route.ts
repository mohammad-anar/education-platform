import express from "express";
import { InstituteRoutes } from "./institute/institute.route.js";
import { SubscriptionRoutes } from "./subscription/subscription.route.js";

const router = express.Router();

router.use("/institutes", InstituteRoutes);
router.use("/subscriptions", SubscriptionRoutes);

export const SaasRoutes = router;
export default SaasRoutes;
