import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IAssessmentFilterRequest } from "./assessment.interface.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).assessment.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: IAssessmentFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).assessment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).assessment.count({
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
  const result = await (prisma as any).assessment.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).assessment.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).assessment.delete({
    where: { id },
  });
  return result;
};

import { domainEventEmitter } from "../../../events/index.js";
import { DomainEventType } from "../../../events/event-types.js";

const submitQuiz = async (
  assessmentId: string,
  payload: { studentId?: string; answers?: any; marks?: number; metadata?: any },
  ctx?: any,
) => {
  const assessment = await (prisma as any).assessment.findUnique({
    where: { id: assessmentId },
  });
  if (!assessment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assessment not found");
  }

  let studentId = payload.studentId;
  if (!studentId && ctx?.userId) {
    const student = await (prisma as any).student.findFirst({
      where: { userId: ctx.userId },
      select: { id: true },
    });
    studentId = student?.id;
  }
  if (!studentId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Student ID is required to submit quiz");
  }

  const marks = payload.marks !== undefined ? payload.marks : 0;
  const result = await (prisma as any).assessmentResult.upsert({
    where: {
      assessmentId_studentId: {
        assessmentId,
        studentId,
      },
    },
    update: {
      marks,
      status: "SUBMITTED",
      submittedAt: new Date(),
      metadata: payload.metadata || payload.answers || null,
    },
    create: {
      assessmentId,
      studentId,
      marks,
      status: "SUBMITTED",
      submittedAt: new Date(),
      metadata: payload.metadata || payload.answers || null,
    },
  });

  domainEventEmitter.emitEvent({
    instituteId: assessment.instituteId || ctx?.instituteId,
    actorId: ctx?.userId,
    eventType: DomainEventType.QUIZ_SUBMITTED,
    entityType: "Assessment",
    entityId: assessmentId,
    properties: {
      studentId,
      marks,
      resultId: result.id,
    },
  });

  return result;
};

const submitAssignment = async (
  assignmentId: string,
  payload: { studentId?: string; content?: string; fileUrl?: string; attempt?: number },
  ctx?: any,
) => {
  const assignment = await (prisma as any).assignment.findUnique({
    where: { id: assignmentId },
    include: { assessment: true },
  });
  if (!assignment) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Assignment not found");
  }

  let studentId = payload.studentId;
  if (!studentId && ctx?.userId) {
    const student = await (prisma as any).student.findFirst({
      where: { userId: ctx.userId },
      select: { id: true },
    });
    studentId = student?.id;
  }
  if (!studentId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Student ID is required to submit assignment");
  }

  const instituteId = assignment.assessment?.instituteId || ctx?.instituteId;
  const attempt = payload.attempt || 1;

  const submission = await (prisma as any).assignmentSubmission.upsert({
    where: {
      assignmentId_studentId_attempt: {
        assignmentId,
        studentId,
        attempt,
      },
    },
    update: {
      content: payload.content,
      fileUrl: payload.fileUrl,
      submittedAt: new Date(),
      status: "SUBMITTED",
    },
    create: {
      assignmentId,
      studentId,
      instituteId,
      attempt,
      content: payload.content,
      fileUrl: payload.fileUrl,
      submittedAt: new Date(),
      status: "SUBMITTED",
    },
  });

  domainEventEmitter.emitEvent({
    instituteId,
    actorId: ctx?.userId,
    eventType: DomainEventType.ASSIGNMENT_SUBMITTED,
    entityType: "Assignment",
    entityId: assignmentId,
    properties: {
      studentId,
      submissionId: submission.id,
      attempt,
    },
  });

  return submission;
};

export const AssessmentService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  submitQuiz,
  submitAssignment,
};
