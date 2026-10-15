import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { ILessonVideoFilterRequest } from "./lessonVideo.interface.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).lessonVideo.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: ILessonVideoFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).lessonVideo.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).lessonVideo.count({
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
  const result = await (prisma as any).lessonVideo.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).lessonVideo.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).lessonVideo.delete({
    where: { id },
  });
  return result;
};

import { domainEventEmitter } from "../../../events/index.js";
import { DomainEventType } from "../../../events/event-types.js";

const recordHeartbeat = async (
  id: string,
  payload: {
    currentPlaybackSeconds: number;
    totalDurationSeconds?: number;
    playbackRate?: number;
    completed?: boolean;
  },
  ctx?: any,
) => {
  const video = await (prisma as any).lessonVideo.findUnique({
    where: { id },
  });

  const instituteId = video?.instituteId || ctx?.instituteId;
  const actorId = ctx?.userId;

  domainEventEmitter.emitVideoHeartbeat({
    instituteId,
    actorId,
    eventType: DomainEventType.VIDEO_HEARTBEAT,
    entityType: "LessonVideo",
    entityId: id,
    properties: {
      lessonId: video?.lessonId,
      currentPlaybackSeconds: payload.currentPlaybackSeconds,
      totalDurationSeconds: payload.totalDurationSeconds,
      playbackRate: payload.playbackRate,
      completed: payload.completed,
    },
  });

  return { success: true, buffered: true };
};

export const LessonVideoService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  recordHeartbeat,
};
