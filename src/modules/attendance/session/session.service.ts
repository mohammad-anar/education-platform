import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { ISessionFilterRequest } from "./session.interface.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).attendanceSession.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: ISessionFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).attendanceSession.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).attendanceSession.count({
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
  const result = await (prisma as any).attendanceSession.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).attendanceSession.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).attendanceSession.delete({
    where: { id },
  });
  return result;
};

import { domainEventEmitter } from "../../../events/index.js";
import { DomainEventType } from "../../../events/event-types.js";

const markAttendance = async (
  sessionId: string,
  records: Array<{
    studentId: string;
    status: any;
    remarks?: string;
  }>,
  ctx?: any,
) => {
  const session = await (prisma as any).attendanceSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Attendance session not found");
  }

  const instituteId = session.instituteId || ctx?.instituteId;

  // Upsert records
  const updatedRecords: any[] = [];
  for (const rec of records) {
    const record = await (prisma as any).attendanceRecord.upsert({
      where: {
        sessionId_studentId: {
          sessionId,
          studentId: rec.studentId,
        },
      },
      update: {
        status: rec.status,
        remarks: rec.remarks,
        markedById: ctx?.userId,
        markedAt: new Date(),
      },
      create: {
        sessionId,
        studentId: rec.studentId,
        instituteId,
        status: rec.status,
        remarks: rec.remarks,
        markedById: ctx?.userId,
        markedAt: new Date(),
      },
    });
    updatedRecords.push(record);
  }

  // Update session status to COMPLETED
  await (prisma as any).attendanceSession.update({
    where: { id: sessionId },
    data: { status: "COMPLETED", closedAt: new Date(), takenById: ctx?.userId },
  });

  // Emit ATTENDANCE_MARKED domain event
  domainEventEmitter.emitEvent({
    instituteId,
    actorId: ctx?.userId,
    eventType: DomainEventType.ATTENDANCE_MARKED,
    entityType: "AttendanceSession",
    entityId: sessionId,
    properties: {
      count: updatedRecords.length,
      sessionDate: session.date,
      records: records.map((r) => ({ studentId: r.studentId, status: r.status })),
    },
  });

  return { sessionId, markedCount: updatedRecords.length, records: updatedRecords };
};

export const SessionService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  markAttendance,
};
