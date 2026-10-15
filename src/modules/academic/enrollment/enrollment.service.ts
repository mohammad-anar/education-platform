import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IEnrollmentFilterRequest } from "./enrollment.interface.js";
import { domainEventEmitter, DomainEventType } from "../../../events/index.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).studentAcademicEnrollment.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: IEnrollmentFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).studentAcademicEnrollment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).studentAcademicEnrollment.count({
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
  const result = await (prisma as any).studentAcademicEnrollment.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).studentAcademicEnrollment.update({
    where: { id },
    data: payload,
  });

  if (payload.status === "BANNED" || payload.status === "SUSPENDED") {
    domainEventEmitter
      .emitEvent({
        instituteId: result.instituteId || ctx?.instituteId || null,
        actorId: ctx?.userId || null,
        eventType: DomainEventType.ENROLLMENT_BANNED,
        entityType: "StudentAcademicEnrollment",
        entityId: id,
        properties: {
          studentId: result.studentId,
          status: result.status,
          reason: payload.statusReason || payload.reason,
        },
      })
      .catch(() => {});
  }

  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).studentAcademicEnrollment.delete({
    where: { id },
  });
  return result;
};

export const EnrollmentService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
