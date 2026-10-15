import { Request, Response } from "express";
import catchAsync from "../../../utils/catchAsync.js";
import sendResponse from "../../../utils/sendResponse.js";
import pick from "../../../utils/pick.js";
import { CertificateService } from "./certificate.service.js";

const create = catchAsync(async (req: Request, res: Response) => {
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    req.body.instituteId = req.ctx.instituteId;
  }
  const result = await CertificateService.create(req.body, req.ctx);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Certificate created successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "instituteId", "status"]);
  if (req.ctx?.instituteId && !req.ctx?.isPlatformAdmin) {
    (filters as any).instituteId = req.ctx.instituteId;
  }
  const paginationOptions = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await CertificateService.getAll(filters, paginationOptions, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificates retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CertificateService.getById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificate retrieved successfully",
    data: result,
  });
});

const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CertificateService.update(id, req.body, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificate updated successfully",
    data: result,
  });
});

const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CertificateService.deleteById(id, req.ctx);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Certificate deleted successfully",
    data: result,
  });
});

export const CertificateController = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
