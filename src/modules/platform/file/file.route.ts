import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { FileController } from "./file.controller.js";
import { FileValidation } from "./file.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("platform.file.create"),
  validateRequest(FileValidation.createZodSchema),
  FileController.create,
);

router.get(
  "/",
  requirePermission("platform.file.read"),
  FileController.getAll,
);

router.get(
  "/:id",
  requirePermission("platform.file.read"),
  FileController.getById,
);

router.patch(
  "/:id",
  requirePermission("platform.file.update"),
  validateRequest(FileValidation.updateZodSchema),
  FileController.update,
);

router.delete(
  "/:id",
  requirePermission("platform.file.delete"),
  FileController.deleteById,
);

export const FileRoutes = router;
export default FileRoutes;
