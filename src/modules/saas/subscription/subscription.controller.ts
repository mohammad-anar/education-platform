import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { SubscriptionService } from "./subscription.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  const result = await SubscriptionService.create(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Subscription created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await SubscriptionService.getAll(filters, paginationOptions);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscriptions retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SubscriptionService.getById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SubscriptionService.update(id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SubscriptionService.deleteById(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Subscription deleted successfully",
    data: result,
  });
});

export const SubscriptionController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
