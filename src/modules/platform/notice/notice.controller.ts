import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { NoticeService } from "./notice.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await NoticeService.createNotice(req.body, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Notice created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status", "category", "pinned"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await NoticeService.getAll(filters, paginationOptions, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notices retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.getById(id, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.updateNotice(id, req.body, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice updated successfully",
    data: result,
  });
});

const publishNotice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.publishNotice(id, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice published successfully",
    data: result,
  });
});

const unpublishNotice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.unpublishNotice(id, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice unpublished successfully",
    data: result,
  });
});

const pinNotice = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.pinNotice(id, req.body.pinned, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: req.body.pinned ? "Notice pinned successfully" : "Notice unpinned successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.deleteNotice(id, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice deleted successfully",
    data: result,
  });
});

const listMyNotices = catchAsync(async (req: Request, res: Response) => {
  const result = await NoticeService.listMyNotices(req.ctx, req.query as any);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User notices retrieved successfully",
    meta: (result.nextCursor ? { nextCursor: result.nextCursor } : undefined) as any,
    data: result.data,
  });
});

const markRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.markRead(req.ctx, id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice marked as read",
    data: result,
  });
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
  const result = await NoticeService.getUnreadCount(req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Unread count retrieved successfully",
    data: result,
  });
});

const getNoticeReadStats = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await NoticeService.getNoticeReadStats(id, req.ctx);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Notice read statistics retrieved successfully",
    data: result,
  });
});

export const NoticeController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  publishNotice,
  unpublishNotice,
  pinNotice,
  listMyNotices,
  markRead,
  getUnreadCount,
  getNoticeReadStats,
};
