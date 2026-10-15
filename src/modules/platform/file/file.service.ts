import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IFileFilterRequest } from "./file.interface.js";
import { logAudit } from "../../../utils/audit.js";
import { enforcePlanLimit } from "../../platform-admin/platform-admin.service.js";

const create = async (payload: any, ctx?: any) => {
  const targetInstituteId = ctx?.instituteId || payload.instituteId;
  if (targetInstituteId) {
    await enforcePlanLimit(
      targetInstituteId,
      "file",
      payload.size ? Number(payload.size) : 0,
    );
  }

  const result = await (prisma as any).fileAsset.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: IFileFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).fileAsset.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).fileAsset.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: result,
  };
};

const getById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).fileAsset.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).fileAsset.update({
    where: { id },
    data: payload,
  });
  return result;
};

/**
 * Deletes a file asset by unique ID and records a FILE_DELETE audit log entry.
 *
 * @param {string} id - The file asset ID to delete.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const deleteById = async (id: string, ctx?: any) => {
  const oldFile = await (prisma as any).fileAsset.findUnique({
    where: { id },
  });

  const result = await (prisma as any).fileAsset.delete({
    where: { id },
  });

  await logAudit({
    ctx,
    action: "FILE_DELETE",
    entityType: "FileAsset",
    entityId: id,
    oldValue: oldFile,
    newValue: null,
  });

  return result;
};

export const FileService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
