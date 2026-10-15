import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import * as SupportService from "./support.service.js";

// ==========================================
// 1. SETTINGS CONTROLLERS
// ==========================================

export const getSupportSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.getSupportSettings(req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support settings retrieved successfully",
    data: result,
  });
});

export const updateSupportSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.updateSupportSettings(req.ctx, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support settings updated successfully",
    data: result,
  });
});

export const getSupportStatus = catchAsync(async (req: Request, res: Response) => {
  const instituteId = req.ctx?.instituteId || "";
  const isOpen = await SupportService.isSupportOpenNow(instituteId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support open status retrieved successfully",
    data: { isOpen },
  });
});

// ==========================================
// 2. STUDENT CONTROLLERS
// ==========================================

export const createTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.createTicket(req.ctx, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Support ticket created successfully",
    data: result,
  });
});

export const listMyTickets = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.listMyTickets(req.ctx, req.query as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Student tickets retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const getMyTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.getMyTicket(req.ctx, req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support ticket retrieved successfully",
    data: result,
  });
});

export const addMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.addMessage(req.ctx, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Message added to support ticket successfully",
    data: result,
  });
});

export const closeMyTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.closeMyTicket(req.ctx, req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support ticket closed successfully",
    data: result,
  });
});

export const rateTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.rateTicket(req.ctx, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket rated successfully",
    data: result,
  });
});

export const requestLiveSession = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.requestLiveSession(req.ctx, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Live support session requested successfully",
    data: result,
  });
});

export const listAvailableSlots = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.listAvailableSlots(req.ctx, req.query as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Available slots retrieved successfully",
    data: result,
  });
});

export const bookSlot = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.bookSlot(req.ctx, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Support session booked successfully",
    data: result,
  });
});

export const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.cancelBooking(req.ctx, req.params.id, req.body?.reason);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support session booking cancelled successfully",
    data: result,
  });
});

// ==========================================
// 3. AGENT / TEACHER CONTROLLERS
// ==========================================

export const listTicketQueue = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.listTicketQueue(req.ctx, req.query as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket queue retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const assignTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.assignTicket(req.ctx, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket assigned successfully",
    data: result,
  });
});

export const changeStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.changeStatus(req.ctx, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket status updated successfully",
    data: result,
  });
});

export const addInternalNote = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.addInternalNote(req.ctx, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Internal note added successfully",
    data: result,
  });
});

export const publishAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.publishAvailability(req.ctx, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Availability slots published successfully",
    data: result,
  });
});

export const confirmSession = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.confirmSession(req.ctx, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support session confirmed successfully",
    data: result,
  });
});

export const completeSession = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.completeSession(req.ctx, req.params.id, req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Support session completed successfully",
    data: result,
  });
});

export const resolveTicket = catchAsync(async (req: Request, res: Response) => {
  const result = await SupportService.resolveTicket(req.ctx, req.params.id, req.body?.notes);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Ticket resolved successfully",
    data: result,
  });
});
