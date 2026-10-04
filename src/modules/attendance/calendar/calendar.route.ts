import express from "express";
import validateRequest from "../../../middleware/validate.middleware.js";
import auth from "../../../middleware/auth.middleware.js";
import { CalendarController } from "./calendar.controller.js";
import { CalendarValidation } from "./calendar.validation.js";

const router = express.Router();

router.post(
  "/",
  auth(),
  validateRequest(CalendarValidation.createZodSchema),
  CalendarController.create,
);

router.get(
  "/",
  auth(),
  CalendarController.getAll,
);

router.get(
  "/:id",
  auth(),
  CalendarController.getById,
);

router.patch(
  "/:id",
  auth(),
  validateRequest(CalendarValidation.updateZodSchema),
  CalendarController.update,
);

router.delete(
  "/:id",
  auth(),
  CalendarController.deleteById,
);

export const CalendarRoutes = router;
export default CalendarRoutes;
