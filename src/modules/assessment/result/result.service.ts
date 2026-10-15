import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IResultFilterRequest } from "./result.interface.js";
import { logAudit } from "../../../utils/audit.js";
import { domainEventEmitter, DomainEventType } from "../../../events/index.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).studentResult.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: IResultFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).studentResult.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).studentResult.count({
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
  const result = await (prisma as any).studentResult.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).studentResult.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).studentResult.delete({
    where: { id },
  });
  return result;
};

/**
 * Publishes a student result (marks status as PUBLISHED, records publishedAt)
 * and logs a STUDENT_RESULT_PUBLISH audit entry.
 *
 * @param {string} id - The StudentResult ID.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const publishResult = async (id: string, ctx?: any) => {
  const oldResult = await (prisma as any).studentResult.findUnique({
    where: { id },
  });

  const result = await (prisma as any).studentResult.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });

  await logAudit({
    ctx,
    action: "STUDENT_RESULT_PUBLISH",
    entityType: "StudentResult",
    entityId: id,
    oldValue: oldResult,
    newValue: result,
  });

  // Emit Domain Event
  domainEventEmitter
    .emitEvent({
      instituteId: result.instituteId,
      actorId: ctx?.userId || null,
      eventType: DomainEventType.RESULT_PUBLISHED,
      entityType: "StudentResult",
      entityId: id,
      properties: {
        studentId: result.studentId,
        examId: result.examId,
        gpa: result.gpa,
        grade: result.grade,
      },
    })
    .catch(() => {});

  return result;
};

/**
 * Manually overrides a student result marks/grade and logs a STUDENT_RESULT_OVERRIDE audit entry.
 *
 * @param {string} id - The StudentResult ID.
 * @param {any} payload - Override fields (manualAdjustmentMarks, finalObtainedMarks, overrideReason, overriddenByUserId).
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const overrideResult = async (id: string, payload: any, ctx?: any) => {
  const oldResult = await (prisma as any).studentResult.findUnique({
    where: { id },
  });

  const result = await (prisma as any).studentResult.update({
    where: { id },
    data: {
      manualAdjustmentMarks: payload.manualAdjustmentMarks !== undefined ? payload.manualAdjustmentMarks : oldResult?.manualAdjustmentMarks,
      finalObtainedMarks: payload.finalObtainedMarks !== undefined ? payload.finalObtainedMarks : oldResult?.finalObtainedMarks,
      overrideReason: payload.overrideReason || null,
      overriddenByUserId: payload.overriddenByUserId || null,
      overriddenAt: new Date(),
      status: payload.status || oldResult?.status,
    },
  });

  await logAudit({
    ctx,
    action: "STUDENT_RESULT_OVERRIDE",
    entityType: "StudentResult",
    entityId: id,
    oldValue: oldResult,
    newValue: result,
  });

  return result;
};

export const ResultService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  publishResult,
  overrideResult,
};
