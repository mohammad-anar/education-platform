import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { ILessonFilterRequest } from "./lesson.interface.js";

const create = async (payload: any) => {
  const result = await (prisma as any).lesson.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: ILessonFilterRequest,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };

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

const getById = async (id: string) => {
  const result = await (prisma as any).lesson.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any) => {
  const result = await (prisma as any).lesson.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string) => {
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
