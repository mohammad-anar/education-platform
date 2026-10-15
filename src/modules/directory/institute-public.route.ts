import express from "express";
import { requirePermission } from "../../middleware/auth.middleware.js";
import { DirectoryController } from "./directory.controller.js";

const router = express.Router();

router.get(
  "/public-profile",
  requirePermission("directory.institute.view"),
  DirectoryController.getInstitutePublicProfile,
);

export const InstitutePublicRoutes = router;
export default InstitutePublicRoutes;
