import prisma from "../config/prisma.js";
import logger from "./logger.js";
import { IPaginationOptions, IGenericResponse } from "../types/pagination.js";
import { calculatePagination } from "./pagination.js";

export const prismaHelper = {
  /**
   * Build Prisma search filter across multiple text fields (case-insensitive)
   */
  buildSearchCondition: (
    searchTerm: string | undefined,
    searchableFields: string[],
  ) => {
    if (!searchTerm || searchableFields.length === 0) {
      return {};
    }

    return {
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    };
  },

  /**
   * Build filter condition excluding pagination & meta parameters
   */
  buildFilterCondition: (
    filterData: Record<string, any>,
    excludeFields = ["searchTerm", "page", "limit", "sortBy", "sortOrder"],
  ) => {
    const cleanFilters: Record<string, any> = {};

    Object.keys(filterData).forEach((key) => {
      if (!excludeFields.includes(key)) {
        const value = filterData[key];
        if (value !== undefined && value !== null && value !== "") {
          if (value === "true") cleanFilters[key] = true;
          else if (value === "false") cleanFilters[key] = false;
          else cleanFilters[key] = value;
        }
      }
    });

    return cleanFilters;
  },

  /**
   * Check database connectivity and query latency
   */
  checkDbHealth: async (): Promise<{ status: string; latencyMs: number }> => {
    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: "healthy",
        latencyMs: Date.now() - start,
      };
    } catch (error: any) {
      logger.error("Database health check failed:", error.message);
      return {
        status: "unhealthy",
        latencyMs: Date.now() - start,
      };
    }
  },

  /**
   * Safe transaction runner with automatic rollback on error
   */
  runTransaction: async <T>(
    callback: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>,
    options?: { maxWait?: number; timeout?: number },
  ): Promise<T> => {
    return prisma.$transaction(async (tx) => {
      return callback(tx);
    }, options);
  },

  /**
   * Generic paginated find helper
   */
  findManyPaginated: async <T, M extends { findMany: any; count: any }>(
    model: M,
    options: {
      pagination: IPaginationOptions;
      where?: any;
      include?: any;
      select?: any;
      searchableFields?: string[];
      searchTerm?: string;
    },
  ): Promise<IGenericResponse<T[]>> => {
    const { page, limit, skip, sortBy, sortOrder } = calculatePagination(options.pagination);
    const searchCondition = prismaHelper.buildSearchCondition(
      options.searchTerm,
      options.searchableFields || [],
    );

    const where = {
      ...options.where,
      ...searchCondition,
    };

    const queryArgs: any = {
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
    };

    if (options.select) {
      queryArgs.select = options.select;
    } else if (options.include) {
      queryArgs.include = options.include;
    }

    const [data, total] = await Promise.all([
      model.findMany(queryArgs),
      model.count({ where }),
    ]);

    const totalPage = Math.ceil(total / limit);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage,
      },
      data,
    };
  },
};

export default prismaHelper;
