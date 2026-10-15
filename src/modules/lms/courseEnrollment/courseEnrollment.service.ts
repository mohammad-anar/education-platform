import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { ICourseEnrollmentFilterRequest } from "./courseEnrollment.interface.js";
import { logAudit } from "../../../utils/audit.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).courseEnrollment.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: ICourseEnrollmentFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).courseEnrollment.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).courseEnrollment.count({
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
  const result = await (prisma as any).courseEnrollment.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).courseEnrollment.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).courseEnrollment.delete({
    where: { id },
  });
  return result;
};

/**
 * Creates a course access restriction (e.g. BAN, SUSPEND, REVOKE_ACCESS) for an enrollment
 * and records a COURSE_ACCESS_RESTRICTION_CREATE audit log.
 *
 * @param {any} payload - The restriction creation data.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const createRestriction = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).courseAccessRestriction.create({
    data: payload,
  });

  await logAudit({
    ctx,
    action: "COURSE_ACCESS_RESTRICTION_CREATE",
    entityType: "CourseAccessRestriction",
    entityId: result.id,
    newValue: result,
  });

  return result;
};

/**
 * Revokes a course access restriction and records a COURSE_ACCESS_RESTRICTION_REVOKE audit log.
 *
 * @param {string} restrictionId - The restriction ID.
 * @param {any} payload - Revocation data (revokedById, revocationReason).
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const revokeRestriction = async (restrictionId: string, payload: any, ctx?: any) => {
  const oldRestriction = await (prisma as any).courseAccessRestriction.findUnique({
    where: { id: restrictionId },
  });

  const result = await (prisma as any).courseAccessRestriction.update({
    where: { id: restrictionId },
    data: {
      revokedAt: new Date(),
      revokedById: payload.revokedById,
      revocationReason: payload.revocationReason || null,
    },
  });

  await logAudit({
    ctx,
    action: "COURSE_ACCESS_RESTRICTION_REVOKE",
    entityType: "CourseAccessRestriction",
    entityId: restrictionId,
    oldValue: oldRestriction,
    newValue: result,
  });

  return result;
};

export const CourseEnrollmentService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  createRestriction,
  revokeRestriction,
};
