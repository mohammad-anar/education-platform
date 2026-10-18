import { z } from "zod";
import { registerRoute, successResponse, paginated } from "../helpers.js";
import * as SupportValidation from "../../../modules/support/support.validation.js";
import { IdParamSchema } from "../components.js";

const TicketSchema = z.object({
  id: z.string().openapi({ example: "cly01tkt_portal_issue" }),
  ticketNumber: z.string().openapi({ example: "TICK-2026-0042" }),
  subject: z.string().openapi({ example: "Unable to access Physics Chapter 3 Quiz" }),
  category: z.string().openapi({ example: "ACADEMIC" }),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).openapi({ example: "HIGH" }),
  status: z.enum(["OPEN", "IN_PROGRESS", "WAITING_ON_STUDENT", "RESOLVED", "CLOSED"]).openapi({ example: "OPEN" }),
  studentId: z.string().openapi({ example: "cly01std_rahim2026" }),
  assignedToId: z.string().nullable().optional().openapi({ example: "cly01tch_hasan101" }),
  createdAt: z.string().openapi({ example: "2026-10-18T06:30:00.000Z" }),
});

const SlotSchema = z.object({
  id: z.string().openapi({ example: "cly01slt_oct19_01" }),
  hostId: z.string().openapi({ example: "cly01tch_hasan101" }),
  hostName: z.string().openapi({ example: "Mohammad Hasan" }),
  startTime: z.string().openapi({ example: "2026-10-19T14:00:00.000Z" }),
  endTime: z.string().openapi({ example: "2026-10-19T14:30:00.000Z" }),
  status: z.enum(["AVAILABLE", "BOOKED", "CANCELLED"]).openapi({ example: "AVAILABLE" }),
});

// 1. Create Ticket
registerRoute({
  method: "post",
  path: "/api/v1/support/tickets",
  tag: "Support System",
  summary: "Open new student support ticket",
  permission: "support.ticket.create",
  scope: "OWN",
  auditLogged: true,
  operationId: "supportCreateTicket",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SupportValidation.createTicketSchema,
          example: {
            subject: "Unable to access Physics Chapter 3 Quiz",
            category: "ACADEMIC",
            priority: "HIGH",
            initialMessage: "When I click start quiz, it shows session locked error.",
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Support ticket registered (TICKET_CREATED event emitted)",
      content: {
        "application/json": {
          schema: successResponse(TicketSchema, "Ticket created"),
        },
      },
    },
  },
});

// 2. My Tickets
registerRoute({
  method: "get",
  path: "/api/v1/support/tickets/my",
  tag: "Support System",
  summary: "List student's active support tickets",
  permission: "support.ticket.view",
  scope: "OWN",
  operationId: "supportListMyTickets",
  responses: {
    200: {
      description: "My support tickets",
      content: {
        "application/json": {
          schema: paginated(TicketSchema, "Tickets retrieved"),
        },
      },
    },
  },
});

// 3. Post Message
registerRoute({
  method: "post",
  path: "/api/v1/support/tickets/my/:id/messages",
  tag: "Support System",
  summary: "Send response message inside active ticket conversation",
  permission: "support.ticket.create",
  scope: "OWN",
  operationId: "supportAddTicketMessage",
  request: {
    params: IdParamSchema,
    body: {
      content: {
        "application/json": {
          schema: SupportValidation.addMessageSchema,
          example: {
            content: "I cleared my browser cache as instructed but the error still persists.",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Message posted to ticket thread",
      content: {
        "application/json": {
          schema: successResponse(z.object({ sent: z.boolean() }), "Message sent"),
        },
      },
    },
  },
});

// 4. Ticket Queue for Support Agents
registerRoute({
  method: "get",
  path: "/api/v1/support/tickets/queue",
  tag: "Support System",
  summary: "Support desk agent ticket queue with status & SLA filters",
  permission: "support.ticket.manage",
  scope: "INSTITUTE",
  operationId: "supportListAgentQueue",
  responses: {
    200: {
      description: "Queue of open support tickets",
      content: {
        "application/json": {
          schema: paginated(TicketSchema, "Queue retrieved"),
        },
      },
    },
  },
});

// 5. Available Appointment Slots
registerRoute({
  method: "get",
  path: "/api/v1/support/slots/available",
  tag: "Support System",
  summary: "List open appointment slots for 1-on-1 teacher consultation",
  permission: "support.ticket.view",
  scope: "INSTITUTE",
  operationId: "supportListAvailableSlots",
  responses: {
    200: {
      description: "Available consultation slots",
      content: {
        "application/json": {
          schema: paginated(SlotSchema, "Slots retrieved"),
        },
      },
    },
  },
});

// 6. Book Slot
registerRoute({
  method: "post",
  path: "/api/v1/support/slots/book",
  tag: "Support System",
  summary: "Book 1-on-1 consultation slot with teacher",
  permission: "support.ticket.create",
  scope: "OWN",
  auditLogged: true,
  operationId: "supportBookSlot",
  request: {
    body: {
      content: {
        "application/json": {
          schema: SupportValidation.bookSlotSchema,
          example: {
            slotId: "cly01slt_oct19_01",
            notes: "Need guidance on Vector dot product integration formulas",
          },
        },
      },
    },
  },
  responses: {
    200: {
      description: "Slot reserved successfully",
      content: {
        "application/json": {
          schema: successResponse(z.object({ booked: z.boolean() }), "Consultation booked"),
        },
      },
    },
  },
});
