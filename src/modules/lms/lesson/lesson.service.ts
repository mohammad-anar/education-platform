import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { ILessonFilterRequest } from "./lesson.interface.js";
import { domainEventEmitter } from "../../../events/index.js";
import { DomainEventType } from "../../../events/event-types.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).lesson.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: ILessonFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).lesson.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).lesson.count({
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
  const result = await (prisma as any).lesson.findUnique({
    where: { id },
  });
  if (result && ctx?.userId) {
    domainEventEmitter
      .emitEvent({
        instituteId: result.instituteId || ctx?.instituteId,
        actorId: ctx.userId,
        eventType: DomainEventType.LESSON_VIEWED,
        entityType: "Lesson",
        entityId: id,
        properties: {
          moduleId: result.moduleId,
          title: result.title,
        },
      })
      .catch(() => {});
  }
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).lesson.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).lesson.delete({
    where: { id },
  });
  return result;
};

export const LessonService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
