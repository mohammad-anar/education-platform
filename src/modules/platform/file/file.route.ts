import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { FileController } from "./file.controller.js";
import { FileValidation } from "./file.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(FileValidation.createZodSchema),
  FileController.create,
);

router.get(
  "/",
  auth(),
  FileController.getAll,
);

router.get(
  "/:id",
  auth(),
  FileController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(FileValidation.updateZodSchema),
  FileController.update,
);

router.delete(
  "/:id",
  auth(),
  FileController.deleteById,
);

export const FileRoutes = router;
export default FileRoutes;
