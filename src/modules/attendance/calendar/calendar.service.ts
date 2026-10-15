import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { prismaHelper } from "../../../utils/prismaHelper.js";
import { ICalendarFilterRequest } from "./calendar.interface.js";

const create = async (payload: any, ctx?: any) => {
  return prisma.attendanceCalendar.create({
    data: payload,
    include: { rules: true, exceptions: true, policy: true },
  });
};

const getAll = async (
  filters: ICalendarFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { searchTerm, instituteId, academicYearId, classGroupId, sectionId, subjectId, courseId, status, ...filterData } = filters as any;
  const whereConditions: any = {
    ...prismaHelper.buildFilterCondition(filterData),
    ...(instituteId ? { instituteId } : {}),
    ...(academicYearId ? { academicYearId } : {}),
    ...(classGroupId ? { classGroupId } : {}),
    ...(sectionId ? { sectionId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(courseId ? { courseId } : {}),
    ...(status ? { status } : {}),
    ...(searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { code: { contains: searchTerm, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  return prismaHelper.findManyPaginated(prisma.attendanceCalendar, {
    pagination: paginationOptions,
    where: whereConditions,
    include: {
      academicYear: true,
      classGroup: true,
      section: true,
      subject: true,
      course: true,
      teacher: { include: { user: true } },
      _count: { select: { sessions: true, rules: true, exceptions: true } },
    },
  });
};

const getById = async (id: string, ctx?: any) => {
  return prisma.attendanceCalendar.findUnique({
    where: { id },
    include: {
      academicYear: true,
      classGroup: true,
      section: true,
      subject: true,
      course: true,
      teacher: { include: { user: true } },
      policy: true,
      rules: true,
      exceptions: true,
      sessions: {
        take: 100,
        orderBy: { date: "asc" },
        include: { _count: { select: { records: true } } },
      },
    },
  });
};

/**
 * Generate Actual Attendance Sessions from Calendar Rules and Exceptions
 */
const generateSessions = async (calendarId: string) => {
  const calendar = await prisma.attendanceCalendar.findUnique({
    where: { id: calendarId },
    include: { rules: { where: { isActive: true } }, exceptions: true },
  });

  if (!calendar) throw new Error("Attendance Calendar not found");

  const startDate = new Date(calendar.startDate);
  const endDate = new Date(calendar.endDate);
  const exceptionMap = new Map<string, any>();

  calendar.exceptions.forEach((exc) => {
    const key = new Date(exc.date).toISOString().split("T")[0];
    exceptionMap.set(key, exc);
  });

  const ruleDayMap = new Map<number, any>();
  calendar.rules.forEach((rule) => {
    ruleDayMap.set(rule.dayOfWeek, rule);
  });

  const sessionsToCreate: any[] = [];
  const curr = new Date(startDate);

  while (curr <= endDate) {
    const dayOfWeek = curr.getDay();
    const dateKey = curr.toISOString().split("T")[0];
    const rule = ruleDayMap.get(dayOfWeek);
    const exception = exceptionMap.get(dateKey);

    if (rule && (!exception || exception.type === "SPECIAL_CLASS")) {
      sessionsToCreate.push({
        instituteId: calendar.instituteId,
        calendarId: calendar.id,
        academicYearId: calendar.academicYearId,
        classGroupId: calendar.classGroupId,
        sectionId: calendar.sectionId,
        subjectId: calendar.subjectId,
        courseId: calendar.courseId,
        teacherId: rule.teacherId || calendar.teacherId,
        date: new Date(curr),
        startTime: rule.startTime,
        endTime: rule.endTime,
        status: "SCHEDULED",
      });
    }

    curr.setDate(curr.getDate() + 1);
  }

  // Create in batches
  if (sessionsToCreate.length > 0) {
    await prisma.attendanceSession.createMany({
      data: sessionsToCreate,
      skipDuplicates: true,
    });
  }

  return {
    generatedCount: sessionsToCreate.length,
    calendarId,
  };
};

const update = async (id: string, payload: any, ctx?: any) => {
  return prisma.attendanceCalendar.update({
    where: { id },
    data: payload,
  });
};

const deleteById = async (id: string, ctx?: any) => {
  return prisma.attendanceCalendar.delete({
    where: { id },
  });
};

export const CalendarService = {
  create,
  getAll,
  getById,
  generateSessions,
  update,
  deleteById,
};
