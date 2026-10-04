import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { CertificateController } from "./certificate.controller.js";
import { CertificateValidation } from "./certificate.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(CertificateValidation.createZodSchema),
  CertificateController.create,
);

router.get(
  "/",
  auth(),
  CertificateController.getAll,
);

router.get(
  "/:id",
  auth(),
  CertificateController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(CertificateValidation.updateZodSchema),
  CertificateController.update,
);

router.delete(
  "/:id",
  auth(),
  CertificateController.deleteById,
);

export const CertificateRoutes = router;
export default CertificateRoutes;
