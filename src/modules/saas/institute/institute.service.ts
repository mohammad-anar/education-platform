import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { prismaHelper } from "../../../utils/prismaHelper.js";
import { IInstituteFilterRequest } from "./institute.interface.js";

const create = async (payload: any) => {
  const result = await prisma.institute.create({
    data: payload,
    include: { settings: true },
  });
  return result;
};

const getAll = async (
  filters: IInstituteFilterRequest,
  paginationOptions: IPaginationOptions,
) => {
  const { searchTerm, ...filterData } = filters;
  const whereConditions = {
    ...prismaHelper.buildFilterCondition(filterData),
    ...(searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { code: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prismaHelper.findManyPaginated(prisma.institute, {
    pagination: paginationOptions,
    where: whereConditions,
    include: {
      settings: true,
      subscription: { include: { plan: true } },
      _count: {
        select: {
          students: true,
          teachers: true,
          courses: true,
          academicYears: true,
        },
      },
    },
  });
};

const getById = async (id: string) => {
  return prisma.institute.findUnique({
    where: { id },
    include: {
      settings: true,
      subscription: { include: { plan: true } },
      _count: {
        select: {
          students: true,
          teachers: true,
          staff: true,
          courses: true,
          academicYears: true,
        },
      },
    },
  });
};

const getStats = async (id: string) => {
  const [studentsCount, teachersCount, coursesCount, activeEnrollments, todaySessions] =
    await Promise.all([
      prisma.student.count({ where: { instituteId: id, status: "ACTIVE" } }),
      prisma.teacherProfile.count({ where: { instituteId: id, employmentStatus: "ACTIVE" } }),
      prisma.course.count({ where: { instituteId: id, status: "PUBLISHED" } }),
      prisma.studentAcademicEnrollment.count({ where: { student: { instituteId: id }, status: "ACTIVE" } }),
      prisma.attendanceSession.count({
        where: {
          instituteId: id,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
    ]);

  return {
    studentsCount,
    teachersCount,
    coursesCount,
    activeEnrollments,
    todaySessions,
  };
};

import { logAudit } from "../../../utils/audit.js";

/**
 * Updates an institute and logs audit entries for updates and suspensions.
 *
 * @param {string} id - The institute ID.
 * @param {any} payload - The update fields.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const update = async (id: string, payload: any, ctx?: any) => {
  const oldInstitute = await prisma.institute.findUnique({
    where: { id },
  });

  const result = await prisma.institute.update({
    where: { id },
    data: payload,
    include: { settings: true },
  });

  const isSuspension = payload.status === "INACTIVE" && oldInstitute?.status === "ACTIVE";
  await logAudit({
    ctx,
    action: isSuspension ? "INSTITUTE_SUSPEND" : "INSTITUTE_UPDATE",
    entityType: "Institute",
    entityId: id,
    oldValue: oldInstitute,
    newValue: result,
  });

  return result;
};

const updateSettings = async (id: string, settingsPayload: any) => {
  return prisma.instituteSetting.upsert({
    where: { instituteId: id },
    update: settingsPayload,
    create: {
      instituteId: id,
      ...settingsPayload,
    },
  });
};

/**
 * Suspends an institute by marking it INACTIVE and records an INSTITUTE_SUSPEND audit log entry.
 *
 * @param {string} id - The institute ID.
 * @param {string} [reason] - Reason for suspension.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const suspend = async (id: string, reason?: string, ctx?: any) => {
  const oldInstitute = await prisma.institute.findUnique({
    where: { id },
  });

  const result = await prisma.institute.update({
    where: { id },
    data: {
      status: "INACTIVE",
    },
    include: { settings: true },
  });

  await logAudit({
    ctx,
    action: "INSTITUTE_SUSPEND",
    entityType: "Institute",
    entityId: id,
    oldValue: oldInstitute,
    newValue: { status: "INACTIVE", reason: reason || null },
  });

  return result;
};

/**
 * Deletes an institute and records an INSTITUTE_DELETE audit log entry.
 *
 * @param {string} id - The institute ID.
 * @param {any} [ctx] - Express Request or audit context.
 * @returns {Promise<any>}
 */
const deleteById = async (id: string, ctx?: any) => {
  const oldInstitute = await prisma.institute.findUnique({
    where: { id },
  });

  const result = await prisma.institute.delete({
    where: { id },
  });

  await logAudit({
    ctx,
    action: "INSTITUTE_DELETE",
    entityType: "Institute",
    entityId: id,
    oldValue: oldInstitute,
    newValue: null,
  });

  return result;
};

export const InstituteService = {
  create,
  getAll,
  getById,
  getStats,
  update,
  updateSettings,
  suspend,
  deleteById,
};
