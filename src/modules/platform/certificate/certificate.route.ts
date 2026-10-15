import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import { requirePermission } from "../../../middleware/auth.middleware.js";
import { CertificateController } from "./certificate.controller.js";
import { CertificateValidation } from "./certificate.validation.js";

const router = express.Router();

router.post(
  "/",
  requirePermission("platform.certificate.create"),
  validateRequest(CertificateValidation.createZodSchema),
  CertificateController.create,
);

router.get(
  "/",
  requirePermission("platform.certificate.read"),
  CertificateController.getAll,
);

router.get(
  "/:id",
  requirePermission("platform.certificate.read"),
  CertificateController.getById,
);

router.patch(
  "/:id",
  requirePermission("platform.certificate.update"),
  validateRequest(CertificateValidation.updateZodSchema),
  CertificateController.update,
);

router.delete(
  "/:id",
  requirePermission("platform.certificate.delete"),
  CertificateController.deleteById,
);

export const CertificateRoutes = router;
export default CertificateRoutes;
