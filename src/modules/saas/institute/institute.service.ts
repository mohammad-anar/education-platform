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

const update = async (id: string, payload: any) => {
  return prisma.institute.update({
    where: { id },
    data: payload,
    include: { settings: true },
  });
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

const deleteById = async (id: string) => {
  return prisma.institute.delete({
    where: { id },
  });
};

export const InstituteService = {
  create,
  getAll,
  getById,
  getStats,
  update,
  updateSettings,
  deleteById,
};
