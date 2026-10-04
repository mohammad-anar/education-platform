import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { NoticeController } from "./notice.controller.js";
import { NoticeValidation } from "./notice.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(NoticeValidation.createZodSchema),
  NoticeController.create,
);

router.get(
  "/",
  auth(),
  NoticeController.getAll,
);

router.get(
  "/:id",
  auth(),
  NoticeController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(NoticeValidation.updateZodSchema),
  NoticeController.update,
);

router.delete(
  "/:id",
  auth(),
  NoticeController.deleteById,
);

export const NoticeRoutes = router;
export default NoticeRoutes;
