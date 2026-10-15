import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IExamFilterRequest } from "./exam.interface.js";
import { logAudit } from "../../../utils/audit.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).exam.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: IExamFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).exam.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).exam.count({
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
  const result = await (prisma as any).exam.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).exam.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).exam.delete({
    where: { id },
  });
  return result;
};

/**
 * Updates an ExamMark by ID and records an EXAM_MARK_UPDATE audit log.
 *
 * @param {string} id - The ExamMark ID.
 * @param {any} payload - Updated mark data (marks, status, remarks, approvedById).
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const updateExamMark = async (id: string, payload: any, ctx?: any) => {
  const oldMark = await (prisma as any).examMark.findUnique({
    where: { id },
  });

  const result = await (prisma as any).examMark.update({
    where: { id },
    data: payload,
  });

  await logAudit({
    ctx,
    action: "EXAM_MARK_UPDATE",
    entityType: "ExamMark",
    entityId: id,
    oldValue: oldMark,
    newValue: result,
  });

  return result;
};

export const ExamService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  updateExamMark,
};
