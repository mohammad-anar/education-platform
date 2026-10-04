import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { ISectionFilterRequest } from "./section.interface.js";

const create = async (payload: any) => {
  const result = await (prisma as any).section.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: ISectionFilterRequest,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };

  const result = await (prisma as any).section.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).section.count({
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

const getById = async (id: string) => {
  const result = await (prisma as any).section.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any) => {
  const result = await (prisma as any).section.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string) => {
  const result = await (prisma as any).section.delete({
    where: { id },
  });
  return result;
};

export const SectionService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
};
