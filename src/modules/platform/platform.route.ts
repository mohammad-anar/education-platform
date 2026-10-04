import express from "express";
import { NoticeRoutes } from "./notice/notice.route.js";
import { NotificationRoutes } from "./notification/notification.route.js";
import { FileRoutes } from "./file/file.route.js";
import { CertificateRoutes } from "./certificate/certificate.route.js";

const router = express.Router();

router.use("/notices", NoticeRoutes);
router.use("/notifications", NotificationRoutes);
router.use("/files", FileRoutes);
router.use("/certificates", CertificateRoutes);

export const PlatformRoutes = router;
export default PlatformRoutes;
