import express from "express";
import validateRequest from "../../middleware/validate.middleware.js";
import { requirePermission } from "../../middleware/auth.middleware.js";
import * as SupportValidation from "./support.validation.js";
import * as SupportController from "./support.controller.js";

const router = express.Router();

// ==========================================
// 1. SETTINGS ROUTES
// ==========================================
router.get(
  "/settings",
  requirePermission("support.settings.manage"),
  SupportController.getSupportSettings
);

router.patch(
  "/settings",
  requirePermission("support.settings.manage"),
  validateRequest(SupportValidation.updateSupportSettingsSchema),
  SupportController.updateSupportSettings
);

router.get(
  "/status",
  requirePermission("support.ticket.view"),
  SupportController.getSupportStatus
);

// ==========================================
// 2. STUDENT ROUTES
// ==========================================
router.post(
  "/tickets",
  requirePermission("support.ticket.create"),
  validateRequest(SupportValidation.createTicketSchema),
  SupportController.createTicket
);

router.get(
  "/tickets/my",
  requirePermission("support.ticket.view"),
  SupportController.listMyTickets
);

router.get(
  "/tickets/my/:id",
  requirePermission("support.ticket.view"),
  SupportController.getMyTicket
);

router.post(
  "/tickets/my/:id/messages",
  requirePermission("support.ticket.create"),
  validateRequest(SupportValidation.addMessageSchema),
  SupportController.addMessage
);

router.post(
  "/tickets/my/:id/close",
  requirePermission("support.ticket.create"),
  SupportController.closeMyTicket
);

router.post(
  "/tickets/my/:id/rate",
  requirePermission("support.ticket.create"),
  validateRequest(SupportValidation.rateTicketSchema),
  SupportController.rateTicket
);

router.post(
  "/tickets/my/:id/request-session",
  requirePermission("support.ticket.create"),
  validateRequest(SupportValidation.requestLiveSessionSchema),
  SupportController.requestLiveSession
);

router.get(
  "/slots/available",
  requirePermission("support.ticket.view"),
  SupportController.listAvailableSlots
);

router.post(
  "/slots/book",
  requirePermission("support.ticket.create"),
  validateRequest(SupportValidation.bookSlotSchema),
  SupportController.bookSlot
);

router.post(
  "/sessions/:id/cancel",
  requirePermission("support.ticket.view"),
  SupportController.cancelBooking
);

// ==========================================
// 3. AGENT / STAFF QUEUE & LIFECYCLE ROUTES
// ==========================================
router.get(
  "/tickets/queue",
  requirePermission("support.ticket.manage"),
  validateRequest(SupportValidation.ticketFilterQuerySchema),
  SupportController.listTicketQueue
);

router.post(
  "/tickets/:id/assign",
  requirePermission("support.ticket.manage"),
  validateRequest(SupportValidation.assignTicketSchema),
  SupportController.assignTicket
);

router.patch(
  "/tickets/:id/status",
  requirePermission("support.ticket.manage"),
  validateRequest(SupportValidation.changeTicketStatusSchema),
  SupportController.changeStatus
);

router.post(
  "/tickets/:id/internal-notes",
  requirePermission("support.ticket.manage"),
  validateRequest(SupportValidation.addInternalNoteSchema),
  SupportController.addInternalNote
);

router.post(
  "/tickets/:id/resolve",
  requirePermission("support.ticket.manage"),
  SupportController.resolveTicket
);

// ==========================================
// 4. HOST / SESSION MANAGEMENT ROUTES
// ==========================================
router.post(
  "/slots/publish",
  requirePermission("support.session.host"),
  validateRequest(SupportValidation.publishAvailabilitySchema),
  SupportController.publishAvailability
);

router.post(
  "/sessions/:id/confirm",
  requirePermission("support.session.host"),
  validateRequest(SupportValidation.confirmSessionSchema),
  SupportController.confirmSession
);

router.post(
  "/sessions/:id/complete",
  requirePermission("support.session.host"),
  validateRequest(SupportValidation.completeSessionSchema),
  SupportController.completeSession
);

export const SupportRoutes = router;
