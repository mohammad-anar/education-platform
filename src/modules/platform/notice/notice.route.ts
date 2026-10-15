import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { NoticeController } from "./notice.controller.js";
import { NoticeValidation } from "./notice.validation.js";

const router = express.Router();

// ==========================================
// 1. USER & MEMBER NOTICEBOARD ROUTES
// ==========================================
router.get(
  "/my",
  requirePermission("platform.notice.read"),
  validateRequest(NoticeValidation.myNoticesQueryZodSchema),
  NoticeController.listMyNotices
);

router.get(
  "/unread-count",
  requirePermission("platform.notice.read"),
  NoticeController.getUnreadCount
);

router.post(
  "/:id/read",
  requirePermission("platform.notice.read"),
  NoticeController.markRead
);

// ==========================================
// 2. MANAGEMENT & AUDIT ROUTES
// ==========================================
router.get(
  "/:id/stats",
  requirePermission("platform.notice.read"),
  NoticeController.getNoticeReadStats
);

router.post(
  "/:id/publish",
  requirePermission("platform.notice.update"),
  NoticeController.publishNotice
);

router.post(
  "/:id/unpublish",
  requirePermission("platform.notice.update"),
  NoticeController.unpublishNotice
);

router.post(
  "/:id/pin",
  requirePermission("platform.notice.update"),
  validateRequest(NoticeValidation.pinZodSchema),
  NoticeController.pinNotice
);

// ==========================================
// 3. CORE CRUD NOTICE ROUTES
// ==========================================
router.post(
  "/",
  requirePermission("platform.notice.create"),
  validateRequest(NoticeValidation.createZodSchema),
  NoticeController.create
);

router.get(
  "/",
  requirePermission("platform.notice.read"),
  validateRequest(NoticeValidation.noticeFilterQueryZodSchema),
  NoticeController.getAll
);

router.get(
  "/:id",
  requirePermission("platform.notice.read"),
  NoticeController.getById
);

router.patch(
  "/:id",
  requirePermission("platform.notice.update"),
  validateRequest(NoticeValidation.updateZodSchema),
  NoticeController.update
);

router.delete(
  "/:id",
  requirePermission("platform.notice.delete"),
  NoticeController.deleteById
);

export const NoticeRoutes = router;
export default NoticeRoutes;
