import { StatusCodes } from "http-status-codes";
import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";

export type RequestContext = any;
import { logAudit } from "../../utils/audit.js";
import { domainEventEmitter, DomainEventType } from "../../events/index.js";
import {
  ICreateTicketPayload,
  IAddMessagePayload,
  IRateTicketPayload,
  IAssignTicketPayload,
  IChangeTicketStatusPayload,
  IAddInternalNotePayload,
  IPublishAvailabilityPayload,
  IBookSlotPayload,
  IConfirmSessionPayload,
  ICompleteSessionPayload,
  IRequestLiveSessionPayload,
  ISupportSettingUpdatePayload,
  ITicketFilterQuery,
} from "./support.interface.js";
import { TicketStatus } from "@prisma/client";

/**
 * Validates that a meeting URL belongs to an allowed domain list.
 *
 * @param {string} meetingUrl - The URL to validate.
 * @param {string[]} [allowedDomains] - List of authorized domains (defaults to zoom.us, meet.google.com).
 * @returns {boolean} True if domain is authorized.
 */
export function validateMeetingUrl(
  meetingUrl: string,
  allowedDomains: string[] = ["zoom.us", "meet.google.com"]
): boolean {
  try {
    const parsed = new URL(meetingUrl);
    const hostname = parsed.hostname.toLowerCase();
    return allowedDomains.some((domain) => {
      const d = domain.toLowerCase().trim();
      return hostname === d || hostname.endsWith("." + d);
    });
  } catch {
    return false;
  }
}

/**
 * Determines whether support is currently open for the given institute setting.
 * Timezone-aware day-of-week and time comparison.
 *
 * @param {any} settings - Institute support settings.
 * @returns {boolean} True if support is open right now.
 */
export function checkSupportOpenNow(settings: {
  isOpen: boolean;
  timezone?: string | null;
  openHours?: any;
} | null): boolean {
  if (!settings || settings.isOpen === false) {
    return false;
  }

  if (!settings.openHours || Object.keys(settings.openHours).length === 0) {
    return true; // No restricted hours configured; open 24/7
  }

  const tz = settings.timezone || "UTC";
  const now = new Date();

  let weekdayPart: string | undefined;
  let hourPart: string | undefined;
  let minutePart: string | undefined;

  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(now);
    weekdayPart = parts.find((p) => p.type === "weekday")?.value?.toLowerCase();
    hourPart = parts.find((p) => p.type === "hour")?.value;
    minutePart = parts.find((p) => p.type === "minute")?.value;
  } catch {
    // If timezone is invalid, fallback to UTC
    const utcHours = String(now.getUTCHours()).padStart(2, "0");
    const utcMins = String(now.getUTCMinutes()).padStart(2, "0");
    const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    weekdayPart = dayNames[now.getUTCDay()];
    hourPart = utcHours;
    minutePart = utcMins;
  }

  if (!weekdayPart || !hourPart || !minutePart) {
    return true;
  }

  const currentTime = `${hourPart.padStart(2, "0")}:${minutePart.padStart(2, "0")}`;
  const schedule = settings.openHours;
  const daySchedule = schedule[weekdayPart] || schedule[weekdayPart.slice(0, 3)];

  if (!daySchedule) {
    return false;
  }

  if (daySchedule.isOpen === false || daySchedule.isClosed === true) {
    return false;
  }

  const start = daySchedule.start || daySchedule.open || "00:00";
  const end = daySchedule.end || daySchedule.close || "23:59";

  return currentTime >= start && currentTime <= end;
}

/**
 * Resolves the authenticated student's profile ID from ctx.userId and ctx.instituteId.
 *
 * @param {RequestContext} ctx - Authenticated context.
 * @returns {Promise<string>} The student record UUID.
 */
export async function resolveStudentId(ctx: RequestContext): Promise<string> {
  if (ctx.studentId) return ctx.studentId;

  const student = await prisma.student.findFirst({
    where: {
      userId: ctx.userId,
      instituteId: ctx.instituteId,
    },
    select: { id: true },
  });

  if (!student) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Authenticated user is not registered as a student in this institute");
  }

  return student.id;
}

/**
 * Sends an in-app notification to a user.
 */
async function sendSupportNotification(params: {
  userId: string;
  instituteId: string;
  title: string;
  message: string;
  data?: any;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        instituteId: params.instituteId,
        type: "SUPPORT",
        title: params.title,
        message: params.message,
        channel: "IN_APP",
        data: params.data,
      },
    });
  } catch (err) {
    // Non-blocking notification delivery failure
    console.error("Failed to send in-app support notification:", err);
  }
}

// ==========================================
// 1. SETTINGS SERVICES
// ==========================================

/**
 * Retrieves institute support configuration. Creates default configuration if not yet initialized.
 */
export async function getSupportSettings(ctx: RequestContext) {
  let settings = await prisma.instituteSupportSetting.findUnique({
    where: { instituteId: ctx.instituteId },
  });

  if (!settings) {
    const institute = await prisma.institute.findUnique({
      where: { id: ctx.instituteId },
      select: { timezone: true },
    });

    settings = await prisma.instituteSupportSetting.create({
      data: {
        instituteId: ctx.instituteId,
        isOpen: true,
        timezone: institute?.timezone || "UTC",
        allowLiveSession: true,
        defaultProvider: "GOOGLE_MEET",
        allowedMeetingDomains: ["zoom.us", "meet.google.com"],
      },
    });
  }

  return settings;
}

/**
 * Updates institute support settings.
 */
export async function updateSupportSettings(ctx: RequestContext, payload: ISupportSettingUpdatePayload) {
  const current = await getSupportSettings(ctx);

  const updated = await prisma.instituteSupportSetting.update({
    where: { instituteId: ctx.instituteId },
    data: {
      isOpen: payload.isOpen !== undefined ? payload.isOpen : current.isOpen,
      openHours: payload.openHours !== undefined ? (payload.openHours as any) : (current.openHours as any),
      timezone: payload.timezone || current.timezone,
      allowLiveSession: payload.allowLiveSession !== undefined ? payload.allowLiveSession : current.allowLiveSession,
      defaultProvider: payload.defaultProvider || current.defaultProvider,
      allowedMeetingDomains: payload.allowedMeetingDomains || current.allowedMeetingDomains,
    },
  });

  await logAudit({
    ctx,
    action: "SUPPORT_SETTINGS_UPDATE",
    entityType: "InstituteSupportSetting",
    entityId: updated.id,
    oldValue: current,
    newValue: updated,
  });

  return updated;
}

/**
 * Checks whether the institute support desk is open right now in a timezone-aware manner.
 */
export async function isSupportOpenNow(instituteId: string): Promise<boolean> {
  const settings = await prisma.instituteSupportSetting.findUnique({
    where: { instituteId },
  });

  return checkSupportOpenNow(settings);
}

// ==========================================
// 2. STUDENT SUPPORT SERVICES
// ==========================================

/**
 * Creates a new support ticket on behalf of the authenticated student.
 */
export async function createTicket(ctx: RequestContext, payload: ICreateTicketPayload) {
  const studentId = await resolveStudentId(ctx);
  const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const ticket = await prisma.supportTicket.create({
    data: {
      instituteId: ctx.instituteId,
      ticketNumber,
      studentId,
      categoryId: payload.categoryId,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority || "MEDIUM",
      status: "OPEN",
      metadata: payload.metadata || {},
      messages: payload.message
        ? {
            create: {
              instituteId: ctx.instituteId,
              senderId: ctx.userId,
              message: payload.message,
              isInternalNote: false,
            },
          }
        : undefined,
    },
    include: {
      category: true,
      messages: true,
    },
  });

  await logAudit({
    ctx,
    action: "SUPPORT_TICKET_CREATE",
    entityType: "SupportTicket",
    entityId: ticket.id,
    newValue: ticket,
  });

  // Emit Domain Event
  domainEventEmitter
    .emitEvent({
      instituteId: ctx.instituteId,
      actorId: ctx.userId,
      eventType: DomainEventType.TICKET_CREATED,
      entityType: "SupportTicket",
      entityId: ticket.id,
      properties: {
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        categoryId: ticket.categoryId,
        priority: ticket.priority,
      },
    })
    .catch(() => {});

  return ticket;
}

/**
 * Lists tickets created by the authenticated student.
 */
export async function listMyTickets(ctx: RequestContext, query: ITicketFilterQuery) {
  const studentId = await resolveStudentId(ctx);
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
  const skip = (page - 1) * limit;

  const where: any = {
    instituteId: ctx.instituteId,
    studentId,
  };

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: "insensitive" } },
      { ticketNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: query.sortOrder === "asc" ? "asc" : "desc" },
      include: {
        category: true,
        sessions: {
          select: {
            id: true,
            scheduledStart: true,
            scheduledEnd: true,
            status: true,
            meetingUrl: true,
          },
        },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
}

/**
 * Fetches a single ticket for the student, stripping any internal agent notes.
 */
export async function getMyTicket(ctx: RequestContext, id: string) {
  const studentId = await resolveStudentId(ctx);

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id,
      instituteId: ctx.instituteId,
      studentId,
    },
    include: {
      category: true,
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      messages: {
        where: { isInternalNote: false },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
        },
      },
      sessions: {
        orderBy: { scheduledStart: "desc" },
      },
    },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  return ticket;
}

/**
 * Student appends a message to their ticket.
 */
export async function addMessage(ctx: RequestContext, ticketId: string, payload: IAddMessagePayload) {
  const studentId = await resolveStudentId(ctx);

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      instituteId: ctx.instituteId,
      studentId,
    },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  if (ticket.status === "CLOSED") {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot add messages to a closed ticket");
  }

  const message = await prisma.supportTicketMessage.create({
    data: {
      instituteId: ctx.instituteId,
      ticketId,
      senderId: ctx.userId,
      message: payload.message,
      isInternalNote: false,
      attachments: payload.attachments || null,
    },
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
    },
  });

  // If waiting for student, transition back to in progress
  if (ticket.status === "WAITING_FOR_STUDENT") {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" },
    });
  }

  if (ticket.assignedToUserId) {
    await sendSupportNotification({
      userId: ticket.assignedToUserId,
      instituteId: ctx.instituteId,
      title: `New message on ticket ${ticket.ticketNumber}`,
      message: payload.message.slice(0, 100),
      data: { ticketId, messageId: message.id },
    });
  }

  return message;
}

/**
 * Student closes their ticket.
 */
export async function closeMyTicket(ctx: RequestContext, id: string) {
  const studentId = await resolveStudentId(ctx);

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id,
      instituteId: ctx.instituteId,
      studentId,
    },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
    },
  });

  await logAudit({
    ctx,
    action: "SUPPORT_TICKET_CLOSE",
    entityType: "SupportTicket",
    entityId: id,
    oldValue: { status: ticket.status },
    newValue: { status: "CLOSED" },
  });

  return updated;
}

/**
 * Student rates the resolution of their ticket (1 to 5).
 */
export async function rateTicket(ctx: RequestContext, id: string, payload: IRateTicketPayload) {
  const studentId = await resolveStudentId(ctx);

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id,
      instituteId: ctx.instituteId,
      studentId,
    },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  const updated = await prisma.supportTicket.update({
    where: { id },
    data: {
      rating: payload.rating,
      ratingFeedback: payload.ratingFeedback || null,
    },
  });

  await logAudit({
    ctx,
    action: "SUPPORT_TICKET_RATE",
    entityType: "SupportTicket",
    entityId: id,
    newValue: { rating: payload.rating, ratingFeedback: payload.ratingFeedback },
  });

  return updated;
}

/**
 * Requests a live support session. Gated by isSupportOpenNow and allowLiveSession.
 */
export async function requestLiveSession(
  ctx: RequestContext,
  ticketId: string,
  payload?: IRequestLiveSessionPayload
) {
  const studentId = await resolveStudentId(ctx);

  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      instituteId: ctx.instituteId,
      studentId,
    },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  const settings = await getSupportSettings(ctx);

  if (!settings.allowLiveSession) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Live support sessions are currently disabled for this institute");
  }

  const openNow = checkSupportOpenNow(settings);
  if (!openNow) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Support desk is currently closed. Live support sessions can only be requested during operational hours"
    );
  }

  if (payload?.slotId) {
    return await bookSlot(ctx, { slotId: payload.slotId, ticketId });
  }

  // Create an ad-hoc session request
  const scheduledStart = new Date(Date.now() + 5 * 60000); // 5 mins from now
  const scheduledEnd = new Date(Date.now() + 35 * 60000);   // 30 min duration

  const session = await prisma.supportSession.create({
    data: {
      instituteId: ctx.instituteId,
      ticketId,
      hostUserId: ticket.assignedToUserId || ctx.userId,
      studentId,
      scheduledStart,
      scheduledEnd,
      status: "REQUESTED",
      notes: payload?.notes || null,
    },
  });

  if (ticket.assignedToUserId) {
    await sendSupportNotification({
      userId: ticket.assignedToUserId,
      instituteId: ctx.instituteId,
      title: `Live Session Requested: Ticket ${ticket.ticketNumber}`,
      message: `Student requested a live support session.`,
      data: { sessionId: session.id, ticketId },
    });
  }

  return session;
}

/**
 * Lists available support slots for booking.
 */
export async function listAvailableSlots(
  ctx: RequestContext,
  query: { userId?: string; from?: string; to?: string }
) {
  const now = new Date();
  const where: any = {
    instituteId: ctx.instituteId,
    isBooked: false,
    status: "AVAILABLE",
    startTime: { gt: now },
  };

  if (query.userId) where.userId = query.userId;
  if (query.from) where.startTime.gte = new Date(query.from);
  if (query.to) where.endTime = { lte: new Date(query.to) };

  const slots = await prisma.supportAvailabilitySlot.findMany({
    where,
    orderBy: { startTime: "asc" },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          teacher: { select: { headline: true } },
        },
      },
    },
  });

  return slots;
}

/**
 * Books an availability slot using a transaction and row lock to prevent double booking.
 */
export async function bookSlot(ctx: RequestContext, payload: IBookSlotPayload) {
  const studentId = await resolveStudentId(ctx);

  return await prisma.$transaction(async (tx) => {
    // Pessimistic row-lock on availability slot
    const lockedSlots: any[] = await tx.$queryRawUnsafe(
      'SELECT id, "instituteId", "userId", "startTime", "endTime", "isBooked", status, version FROM "support_availability_slots" WHERE id = $1::uuid AND "instituteId" = $2::uuid FOR UPDATE',
      payload.slotId,
      ctx.instituteId
    );

    if (!lockedSlots || lockedSlots.length === 0) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Availability slot not found");
    }

    const slot = lockedSlots[0];

    if (slot.isBooked || slot.status !== "AVAILABLE") {
      throw new ApiError(StatusCodes.CONFLICT, "This slot has already been booked by another user");
    }

    const ticket = await tx.supportTicket.findFirst({
      where: {
        id: payload.ticketId,
        instituteId: ctx.instituteId,
        studentId,
      },
    });

    if (!ticket) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found or does not belong to student");
    }

    // Mark slot as booked
    await tx.supportAvailabilitySlot.update({
      where: { id: payload.slotId },
      data: {
        isBooked: true,
        status: "BOOKED",
        version: { increment: 1 },
      },
    });

    // Create booked support session
    const session = await tx.supportSession.create({
      data: {
        instituteId: ctx.instituteId,
        ticketId: payload.ticketId,
        slotId: payload.slotId,
        hostUserId: slot.userId,
        studentId,
        scheduledStart: slot.startTime,
        scheduledEnd: slot.endTime,
        status: "SCHEDULED",
      },
    });

    await tx.supportTicket.update({
      where: { id: payload.ticketId },
      data: { status: "IN_PROGRESS" },
    });

    await sendSupportNotification({
      userId: slot.userId,
      instituteId: ctx.instituteId,
      title: `Slot Booked for Ticket ${ticket.ticketNumber}`,
      message: `A student booked your session from ${new Date(slot.startTime).toLocaleTimeString()} to ${new Date(slot.endTime).toLocaleTimeString()}.`,
      data: { sessionId: session.id, ticketId: payload.ticketId },
    });

    return session;
  });
}

/**
 * Cancels a booked support session and releases the availability slot.
 */
export async function cancelBooking(ctx: RequestContext, sessionId: string, reason?: string) {
  const session = await prisma.supportSession.findFirst({
    where: {
      id: sessionId,
      instituteId: ctx.instituteId,
    },
  });

  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Session not found");
  }

  const updatedSession = await prisma.$transaction(async (tx) => {
    if (session.slotId) {
      await tx.supportAvailabilitySlot.update({
        where: { id: session.slotId },
        data: {
          isBooked: false,
          status: "AVAILABLE",
        },
      });
    }

    return await tx.supportSession.update({
      where: { id: sessionId },
      data: {
        status: "CANCELLED",
        cancelledReason: reason || "Cancelled by user",
      },
    });
  });

  await logAudit({
    ctx,
    action: "SUPPORT_SESSION_CANCEL",
    entityType: "SupportSession",
    entityId: sessionId,
    oldValue: { status: session.status },
    newValue: { status: "CANCELLED" },
  });

  return updatedSession;
}

// ==========================================
// 3. AGENT / TEACHER SUPPORT SERVICES
// ==========================================

/**
 * Lists tickets in the agent/staff support queue, respecting user permissions and assigned scope.
 */
export async function listTicketQueue(ctx: RequestContext, query: ITicketFilterQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  const skip = (page - 1) * limit;

  const where: any = { instituteId: ctx.instituteId };

  if (ctx.scope === "ASSIGNED") {
    where.assignedToUserId = ctx.userId;
  } else if (ctx.scope === "OWN") {
    const student = await prisma.student.findFirst({
      where: { userId: ctx.userId, instituteId: ctx.instituteId },
      select: { id: true },
    });
    if (student) where.studentId = student.id;
  }

  if (query.status) where.status = query.status;
  if (query.priority) where.priority = query.priority;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.assignedToUserId) where.assignedToUserId = query.assignedToUserId;
  if (query.studentId) where.studentId = query.studentId;

  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: "insensitive" } },
      { ticketNumber: { contains: query.search, mode: "insensitive" } },
      { student: { studentCode: { contains: query.search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: query.sortOrder === "asc" ? "asc" : "desc" },
      include: {
        category: true,
        student: {
          select: {
            id: true,
            studentCode: true,
            user: { select: { firstName: true, lastName: true, avatarUrl: true, email: true } },
          },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
}

/**
 * Assigns a ticket to a support agent or teacher.
 */
export async function assignTicket(ctx: RequestContext, ticketId: string, payload: IAssignTicketPayload) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, instituteId: ctx.instituteId },
    include: { student: { select: { userId: true } } },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      assignedToUserId: payload.assignedToUserId,
      status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status,
    },
    include: {
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  await logAudit({
    ctx,
    action: "SUPPORT_TICKET_ASSIGN",
    entityType: "SupportTicket",
    entityId: ticketId,
    oldValue: { assignedToUserId: ticket.assignedToUserId },
    newValue: { assignedToUserId: payload.assignedToUserId },
  });

  // Notify assigned agent
  await sendSupportNotification({
    userId: payload.assignedToUserId,
    instituteId: ctx.instituteId,
    title: `Ticket Assigned: ${ticket.ticketNumber}`,
    message: `You have been assigned to ticket "${ticket.subject}".`,
    data: { ticketId },
  });

  // Notify student
  if (ticket.student.userId) {
    await sendSupportNotification({
      userId: ticket.student.userId,
      instituteId: ctx.instituteId,
      title: `Agent Assigned to Ticket ${ticket.ticketNumber}`,
      message: `${updated.assignedTo?.firstName || "A support agent"} has been assigned to your ticket.`,
      data: { ticketId },
    });
  }

  return updated;
}

/**
 * Updates the lifecycle status of a support ticket.
 */
export async function changeStatus(ctx: RequestContext, ticketId: string, payload: IChangeTicketStatusPayload) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, instituteId: ctx.instituteId },
    include: { student: { select: { userId: true } } },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  const updateData: any = { status: payload.status };
  if (payload.status === "RESOLVED") updateData.resolvedAt = new Date();
  if (payload.status === "CLOSED") updateData.closedAt = new Date();

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: updateData,
  });

  await logAudit({
    ctx,
    action: "SUPPORT_TICKET_STATUS_CHANGE",
    entityType: "SupportTicket",
    entityId: ticketId,
    oldValue: { status: ticket.status },
    newValue: { status: payload.status },
  });

  if (ticket.student.userId) {
    await sendSupportNotification({
      userId: ticket.student.userId,
      instituteId: ctx.instituteId,
      title: `Ticket ${ticket.ticketNumber} Status: ${payload.status}`,
      message: `Your ticket status was updated to ${payload.status}.`,
      data: { ticketId, status: payload.status },
    });
  }

  return updated;
}

/**
 * Adds an internal staff-only note to a ticket.
 */
export async function addInternalNote(ctx: RequestContext, ticketId: string, payload: IAddInternalNotePayload) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, instituteId: ctx.instituteId },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  const note = await prisma.supportTicketMessage.create({
    data: {
      instituteId: ctx.instituteId,
      ticketId,
      senderId: ctx.userId,
      message: payload.note,
      isInternalNote: true,
      attachments: payload.attachments || null,
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });

  return note;
}

/**
 * Teacher or support agent publishes availability slots.
 */
export async function publishAvailability(ctx: RequestContext, payload: IPublishAvailabilityPayload) {
  const createdSlots = [];

  for (const slot of payload.slots) {
    const sStart = new Date(slot.startTime);
    const sEnd = new Date(slot.endTime);

    if (sEnd <= sStart) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Slot end time must be after start time");
    }

    const created = await prisma.supportAvailabilitySlot.create({
      data: {
        instituteId: ctx.instituteId,
        userId: ctx.userId,
        startTime: sStart,
        endTime: sEnd,
        isBooked: false,
        status: "AVAILABLE",
      },
    });

    createdSlots.push(created);
  }

  await logAudit({
    ctx,
    action: "SUPPORT_AVAILABILITY_PUBLISH",
    entityType: "SupportAvailabilitySlot",
    newValue: { count: createdSlots.length, slots: createdSlots },
  });

  return createdSlots;
}

/**
 * Confirms a support session with meeting details.
 * Validates meetingUrl domain against configured allowlist.
 */
export async function confirmSession(ctx: RequestContext, sessionId: string, payload: IConfirmSessionPayload) {
  const session = await prisma.supportSession.findFirst({
    where: { id: sessionId, instituteId: ctx.instituteId },
    include: {
      student: { select: { userId: true } },
      ticket: { select: { ticketNumber: true } },
    },
  });

  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Session not found");
  }

  const settings = await getSupportSettings(ctx);
  let finalMeetingUrl = payload.meetingUrl;

  if (finalMeetingUrl) {
    const isValid = validateMeetingUrl(finalMeetingUrl, settings.allowedMeetingDomains);
    if (!isValid) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        `Meeting URL domain is not allowed. Authorized domains: ${settings.allowedMeetingDomains.join(", ")}`
      );
    }
  } else {
    // Attempt host profile default meeting URL
    const teacherProfile = await prisma.teacherProfile.findFirst({
      where: { userId: ctx.userId, instituteId: ctx.instituteId },
      select: { defaultMeetingUrl: true },
    });
    const staffProfile = await prisma.staffProfile.findFirst({
      where: { userId: ctx.userId, instituteId: ctx.instituteId },
      select: { defaultMeetingUrl: true },
    });

    finalMeetingUrl = teacherProfile?.defaultMeetingUrl || staffProfile?.defaultMeetingUrl || "https://meet.google.com/edu-support";
  }

  const updated = await prisma.supportSession.update({
    where: { id: sessionId },
    data: {
      meetingUrl: finalMeetingUrl,
      meetingProvider: payload.meetingProvider || settings.defaultProvider,
      status: "SCHEDULED",
      confirmedAt: new Date(),
    },
  });

  await logAudit({
    ctx,
    action: "SUPPORT_SESSION_CONFIRM",
    entityType: "SupportSession",
    entityId: sessionId,
    newValue: updated,
  });

  if (session.student.userId) {
    await sendSupportNotification({
      userId: session.student.userId,
      instituteId: ctx.instituteId,
      title: `Support Session Confirmed for Ticket ${session.ticket.ticketNumber}`,
      message: `Your session has been confirmed. Meeting URL: ${finalMeetingUrl}`,
      data: { sessionId, meetingUrl: finalMeetingUrl },
    });
  }

  return updated;
}

/**
 * Completes a support session and stores closing notes.
 */
export async function completeSession(ctx: RequestContext, sessionId: string, payload: ICompleteSessionPayload) {
  const session = await prisma.supportSession.findFirst({
    where: { id: sessionId, instituteId: ctx.instituteId },
  });

  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Session not found");
  }

  const updated = await prisma.supportSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      notes: payload.notes || session.notes,
      completedAt: new Date(),
    },
  });

  await logAudit({
    ctx,
    action: "SUPPORT_SESSION_COMPLETE",
    entityType: "SupportSession",
    entityId: sessionId,
    newValue: updated,
  });

  return updated;
}

/**
 * Resolves a support ticket.
 */
export async function resolveTicket(ctx: RequestContext, ticketId: string, resolutionNotes?: string) {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: ticketId, instituteId: ctx.instituteId },
    include: { student: { select: { userId: true } } },
  });

  if (!ticket) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Ticket not found");
  }

  const updated = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  if (resolutionNotes) {
    await prisma.supportTicketMessage.create({
      data: {
        instituteId: ctx.instituteId,
        ticketId,
        senderId: ctx.userId,
        message: `[Resolution Note]: ${resolutionNotes}`,
        isInternalNote: false,
      },
    });
  }

  await logAudit({
    ctx,
    action: "SUPPORT_TICKET_RESOLVE",
    entityType: "SupportTicket",
    entityId: ticketId,
    oldValue: { status: ticket.status },
    newValue: { status: "RESOLVED" },
  });

  if (ticket.student.userId) {
    await sendSupportNotification({
      userId: ticket.student.userId,
      instituteId: ctx.instituteId,
      title: `Ticket ${ticket.ticketNumber} Resolved`,
      message: "Your ticket has been marked as resolved. Please rate your experience.",
      data: { ticketId },
    });
  }

  return updated;
}
