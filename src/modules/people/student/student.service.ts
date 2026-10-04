import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { prismaHelper } from "../../../utils/prismaHelper.js";
import { IStudentFilterRequest } from "./student.interface.js";

const create = async (payload: any) => {
  return prisma.student.create({
    data: payload,
    include: {
      user: true,
      guardians: { include: { guardian: true } },
    },
  });
};

const getAll = async (
  filters: IStudentFilterRequest,
  paginationOptions: IPaginationOptions,
) => {
  const { searchTerm, instituteId, status, gender, bloodGroup, ...filterData } = filters as any;
  const whereConditions: any = {
    ...prismaHelper.buildFilterCondition(filterData),
    ...(instituteId ? { instituteId } : {}),
    ...(status ? { status } : {}),
    ...(gender ? { gender } : {}),
    ...(bloodGroup ? { bloodGroup } : {}),
    ...(searchTerm
      ? {
          OR: [
            { studentCode: { contains: searchTerm, mode: "insensitive" } },
            { admissionNo: { contains: searchTerm, mode: "insensitive" } },
            { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
            { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
            { user: { email: { contains: searchTerm, mode: "insensitive" } } },
            { user: { phone: { contains: searchTerm, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prismaHelper.findManyPaginated(prisma.student, {
    pagination: paginationOptions,
    where: whereConditions,
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      academicEnrollments: {
        where: { status: "ACTIVE" },
        include: {
          academicYear: true,
          classGroup: true,
          section: true,
        },
      },
    },
  });
};

const getById = async (id: string) => {
  return prisma.student.findUnique({
    where: { id },
    include: {
      user: true,
      guardians: { include: { guardian: { include: { user: true } } } },
      academicEnrollments: {
        include: { academicYear: true, classGroup: true, section: true, program: true },
      },
      courseEnrollments: { include: { course: true } },
      certificates: true,
    },
  });
};

const getStats = async (id: string) => {
  const [totalSessions, presentRecords, enrolledCourses, recentResults] = await Promise.all([
    prisma.attendanceRecord.count({ where: { studentId: id } }),
    prisma.attendanceRecord.count({ where: { studentId: id, status: "PRESENT" } }),
    prisma.courseEnrollment.count({ where: { studentId: id, status: "ACTIVE" } }),
    prisma.studentResult.findMany({
      where: { studentId: id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { subject: true, academicYear: true },
    }),
  ]);

  const attendancePercent = totalSessions > 0 ? (presentRecords / totalSessions) * 100 : 0;

  return {
    totalSessions,
    presentRecords,
    attendancePercent: Number(attendancePercent.toFixed(2)),
    enrolledCourses,
    recentResults,
  };
};

const update = async (id: string, payload: any) => {
  return prisma.student.update({
    where: { id },
    data: payload,
    include: { user: true },
  });
};

const deleteById = async (id: string) => {
  return prisma.student.delete({
    where: { id },
  });
};

export const StudentService = {
  create,
  getAll,
  getById,
  getStats,
  update,
  deleteById,
};
