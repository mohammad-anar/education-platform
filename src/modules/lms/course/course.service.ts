import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { prismaHelper } from "../../../utils/prismaHelper.js";
import { ICourseFilterRequest } from "./course.interface.js";

const create = async (payload: any) => {
  return prisma.course.create({
    data: payload,
    include: { teachers: true, subject: true },
  });
};

const getAll = async (
  filters: ICourseFilterRequest,
  paginationOptions: IPaginationOptions,
) => {
  const { searchTerm, instituteId, subjectId, status, isPublic, ...filterData } = filters as any;
  const whereConditions: any = {
    ...prismaHelper.buildFilterCondition(filterData),
    ...(instituteId ? { instituteId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(status ? { status } : {}),
    ...(isPublic !== undefined ? { isPublic: isPublic === "true" || isPublic === true } : {}),
    ...(searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { code: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  return prismaHelper.findManyPaginated(prisma.course, {
    pagination: paginationOptions,
    where: whereConditions,
    include: {
      subject: true,
      teachers: { include: { teacher: { include: { user: true } } } },
      _count: {
        select: {
          enrollments: true,
          milestones: true,
          modules: true,
        },
      },
    },
  });
};

const getById = async (id: string) => {
  return prisma.course.findUnique({
    where: { id },
    include: {
      subject: true,
      teachers: { include: { teacher: { include: { user: true } } } },
      milestones: {
        orderBy: { sortOrder: "asc" },
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: {
              learningItems: {
                orderBy: { sortOrder: "asc" },
                include: {
                  lesson: { include: { videos: true, resources: true } },
                  assessment: true,
                },
              },
            },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
};

const getStats = async (id: string) => {
  const [totalStudents, activeStudents, completedStudents, bannedStudents] = await Promise.all([
    prisma.courseEnrollment.count({ where: { courseId: id } }),
    prisma.courseEnrollment.count({ where: { courseId: id, status: "ACTIVE" } }),
    prisma.courseEnrollment.count({ where: { courseId: id, status: "COMPLETED" } }),
    prisma.courseEnrollment.count({ where: { courseId: id, status: "BANNED" } }),
  ]);

  return {
    totalStudents,
    activeStudents,
    completedStudents,
    bannedStudents,
    completionRate: totalStudents > 0 ? Number(((completedStudents / totalStudents) * 100).toFixed(2)) : 0,
  };
};

const update = async (id: string, payload: any) => {
  return prisma.course.update({
    where: { id },
    data: payload,
  });
};

const deleteById = async (id: string) => {
  return prisma.course.delete({
    where: { id },
  });
};

export const CourseService = {
  create,
  getAll,
  getById,
  getStats,
  update,
  deleteById,
};
