import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { ISubscriptionFilterRequest } from "./subscription.interface.js";
import { logAudit } from "../../../utils/audit.js";

/**
 * Creates a new subscription and records an audit log entry.
 *
 * @param {any} payload - Subscription creation data.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).subscription.create({
    data: payload,
  });

  await logAudit({
    ctx,
    action: "SUBSCRIPTION_CHANGE",
    entityType: "Subscription",
    entityId: result.id,
    newValue: result,
  });

  return result;
};

const getAll = async (
  filters: ISubscriptionFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).subscription.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).subscription.count({
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
  const result = await (prisma as any).subscription.findUnique({
    where: { id },
  });
  return result;
};

/**
 * Updates a subscription and records an audit log entry.
 *
 * @param {string} id - The subscription ID.
 * @param {any} payload - Updated fields.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const update = async (id: string, payload: any, ctx?: any) => {
  const oldSubscription = await (prisma as any).subscription.findUnique({
    where: { id },
  });

  const result = await (prisma as any).subscription.update({
    where: { id },
    data: payload,
  });

  await logAudit({
    ctx,
    action: "SUBSCRIPTION_CHANGE",
    entityType: "Subscription",
    entityId: id,
    oldValue: oldSubscription,
    newValue: result,
  });

  return result;
};

/**
 * Deletes a subscription and records an audit log entry.
 *
 * @param {string} id - The subscription ID.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const deleteById = async (id: string, ctx?: any) => {
  const oldSubscription = await (prisma as any).subscription.findUnique({
    where: { id },
  });

  const result = await (prisma as any).subscription.delete({
    where: { id },
  });

  await logAudit({
    ctx,
    action: "SUBSCRIPTION_CHANGE",
    entityType: "Subscription",
    entityId: id,
    oldValue: oldSubscription,
    newValue: null,
  });

  return result;
};

export const SubscriptionService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
