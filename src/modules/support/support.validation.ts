import { z } from "zod";
import { TicketPriority, TicketStatus } from "@prisma/client";

export const updateSupportSettingsSchema = z.object({
  body: z.object({
    isOpen: z.boolean().optional(),
    openHours: z.record(z.string(), z.object({
      isOpen: z.boolean().optional(),
      start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
      end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
    })).optional(),
    timezone: z.string().min(1).optional(),
    allowLiveSession: z.boolean().optional(),
    defaultProvider: z.string().min(1).optional(),
    allowedMeetingDomains: z.array(z.string().min(1)).optional(),
  }),
});

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3).max(255),
    description: z.string().min(5),
    categoryId: z.string().uuid().optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    message: z.string().optional(),
    metadata: z.any().optional(),
  }),
});

export const addMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1),
    attachments: z.any().optional(),
  }),
});

export const rateTicketSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    ratingFeedback: z.string().max(1000).optional(),
  }),
});

export const assignTicketSchema = z.object({
  body: z.object({
    assignedToUserId: z.string().uuid(),
  }),
});

export const changeTicketStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(TicketStatus),
  }),
});

export const addInternalNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1),
    attachments: z.any().optional(),
  }),
});

export const publishAvailabilitySchema = z.object({
  body: z.object({
    slots: z.array(
      z.object({
        startTime: z.string().datetime({ offset: true }).or(z.string().datetime()),
        endTime: z.string().datetime({ offset: true }).or(z.string().datetime()),
      })
    ).min(1),
  }),
});

export const bookSlotSchema = z.object({
  body: z.object({
    slotId: z.string().uuid(),
    ticketId: z.string().uuid(),
  }),
});

export const confirmSessionSchema = z.object({
  body: z.object({
    meetingUrl: z.string().url().optional(),
    meetingProvider: z.string().optional(),
  }),
});

export const completeSessionSchema = z.object({
  body: z.object({
    notes: z.string().max(2000).optional(),
  }),
});

export const requestLiveSessionSchema = z.object({
  body: z.object({
    notes: z.string().max(1000).optional(),
    slotId: z.string().uuid().optional(),
  }).optional(),
});

export const ticketFilterQuerySchema = z.object({
  query: z.object({
    status: z.nativeEnum(TicketStatus).optional(),
    priority: z.nativeEnum(TicketPriority).optional(),
    categoryId: z.string().uuid().optional(),
    assignedToUserId: z.string().uuid().optional(),
    studentId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});
