import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { IPermissionFilterRequest } from "./permission.interface.js";

const create = async (payload: any, ctx?: any) => {
  const result = await (prisma as any).permission.create({
    data: payload,
  });
  return result;
};

const getAll = async (
  filters: IPermissionFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = { ...filters };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).permission.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await (prisma as any).permission.count({
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
  const result = await (prisma as any).permission.findUnique({
    where: { id },
  });
  return result;
};

const update = async (id: string, payload: any, ctx?: any) => {
  const result = await (prisma as any).permission.update({
    where: { id },
    data: payload,
  });
  return result;
};

const deleteById = async (id: string, ctx?: any) => {
  const result = await (prisma as any).permission.delete({
    where: { id },
  });
  return result;
};

import { PERMISSION_CATALOG } from "../permission-engine/permission-catalog.js";

/**
 * Returns the full system permission catalog grouped by module and resource with allowed actions.
 *
 * @returns {Promise<{ total: number; modules: any[] }>}
 */
const listCatalog = async () => {
  const modulesMap = new Map<string, Map<string, any[]>>();

  for (const perm of PERMISSION_CATALOG) {
    if (!modulesMap.has(perm.module)) {
      modulesMap.set(perm.module, new Map());
    }
    const resourceMap = modulesMap.get(perm.module)!;
    if (!resourceMap.has(perm.resource)) {
      resourceMap.set(perm.resource, []);
    }
    resourceMap.get(perm.resource)!.push({
      action: perm.action,
      code: perm.code,
      description: perm.description,
      defaultScope: perm.defaultScope,
    });
  }

  const modules = Array.from(modulesMap.entries()).map(([moduleName, resources]) => ({
    module: moduleName,
    resources: Array.from(resources.entries()).map(([resourceName, actions]) => ({
      resource: resourceName,
      actions,
    })),
  }));

  return {
    total: PERMISSION_CATALOG.length,
    modules,
  };
};

export const PermissionService = {
  create,
  getAll,
  getById,
  update,
  deleteById,
  listCatalog,
};
