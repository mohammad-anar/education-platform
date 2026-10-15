import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IModuleFilterRequest } from "./module.interface.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).module.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: IModuleFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).module.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).module.count({
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
  const result = await (prisma as any).module.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).module.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).module.delete({
    where: { id },
  });
  return result;
};

export const ModuleService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
