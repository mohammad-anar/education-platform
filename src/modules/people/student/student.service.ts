import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { prismaHelper } from "../../../utils/prismaHelper.js";
import { IStudentFilterRequest } from "./student.interface.js";
import { logAudit } from "../../../utils/audit.js";
import { enforcePlanLimit } from "../../platform-admin/platform-admin.service.js";

const create = async (payload: any, ctx?: any) => {
  const targetInstituteId = ctx?.instituteId || payload.instituteId;
  if (targetInstituteId) {
    await enforcePlanLimit(targetInstituteId, "student");
  }

  return (prisma as any).student.create({
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
  ctx?: any,
) => {
  const { searchTerm, instituteId, status, gender, bloodGroup, ...filterData } = filters as any;
  const targetInstituteId = ctx?.instituteId && !ctx?.isPlatformAdmin ? ctx.instituteId : instituteId;

  const whereConditions: any = {
    ...prismaHelper.buildFilterCondition(filterData),
    ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
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

  return prismaHelper.findManyPaginated((prisma as any).student, {
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
      photoFileAsset: true,
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

const getById = async (id: string, ctx?: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).student.findFirst({
    where: whereConditions,
    include: {
      user: true,
      photoFileAsset: true,
      documents: {
        include: {
          fileAsset: true,
          verifiedBy: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      },
      guardians: { include: { guardian: { include: { user: true } } } },
      academicEnrollments: {
        include: { academicYear: true, classGroup: true, section: true, program: true },
      },
      courseEnrollments: { include: { course: true } },
      certificates: true,
    },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Student not found.");
  }

  return result;
};

const getStats = async (id: string, ctx?: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const student = await (prisma as any).student.findFirst({ where: whereConditions });
  if (!student) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Student not found.");
  }

  const [totalSessions, presentRecords, enrolledCourses, recentResults] = await Promise.all([
    (prisma as any).attendanceRecord.count({ where: { studentId: id } }),
    (prisma as any).attendanceRecord.count({ where: { studentId: id, status: "PRESENT" } }),
    (prisma as any).courseEnrollment.count({ where: { studentId: id, status: "ACTIVE" } }),
    (prisma as any).studentResult.findMany({
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

/**
 * Retrieves the student profile of the currently authenticated user.
 */
const getMyProfile = async (ctx: any) => {
  if (!ctx?.userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required.");
  }

  const whereConditions: any = { userId: ctx.userId };
  if (ctx.instituteId) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const student = await (prisma as any).student.findFirst({
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
          status: true,
        },
      },
      photoFileAsset: true,
      documents: {
        include: {
          fileAsset: true,
        },
      },
      guardians: {
        include: {
          guardian: {
            include: { user: true },
          },
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

  if (!student) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Student profile not found for this user.");
  }

  return student;
};

/**
 * Updates self-editable profile fields for the authenticated student.
 */
const updateMyProfile = async (ctx: any, data: any) => {
  const current = await getMyProfile(ctx);

  const updated = await (prisma as any).student.update({
    where: { id: current.id },
    data,
    include: {
      user: true,
      photoFileAsset: true,
    },
  });

  return updated;
};

/**
 * Administrator updates a student profile with diff auditing.
 */
const adminUpdateProfile = async (ctx: any, id: string, data: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const oldStudent = await (prisma as any).student.findFirst({
    where: whereConditions,
  });

  if (!oldStudent) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Student not found.");
  }

  const updated = await (prisma as any).student.update({
    where: { id },
    data,
    include: { user: true, photoFileAsset: true },
  });

  await logAudit({
    ctx,
    action: "STUDENT_PROFILE_UPDATE",
    entityType: "Student",
    entityId: id,
    oldValue: oldStudent,
    newValue: updated,
  });

  return updated;
};

/**
 * Uploads or links profile photo for student.
 */
const uploadProfilePhoto = async (ctx: any, fileAssetId: string) => {
  const current = await getMyProfile(ctx);

  const file = await (prisma as any).fileAsset.findFirst({
    where: {
      id: fileAssetId,
      ...(ctx.instituteId ? { instituteId: ctx.instituteId } : {}),
    },
  });

  if (!file) {
    throw new ApiError(StatusCodes.NOT_FOUND, "File asset not found.");
  }

  const updated = await (prisma as any).student.update({
    where: { id: current.id },
    data: { photoFileAssetId: fileAssetId },
    include: { photoFileAsset: true },
  });

  return updated;
};

/**
 * Adds a document to the student's profile.
 */
const addDocument = async (ctx: any, data: any) => {
  const current = await getMyProfile(ctx);

  if (data.fileAssetId) {
    const file = await (prisma as any).fileAsset.findFirst({
      where: {
        id: data.fileAssetId,
        ...(ctx.instituteId ? { instituteId: ctx.instituteId } : {}),
      },
    });
    if (!file) {
      throw new ApiError(StatusCodes.NOT_FOUND, "File asset not found.");
    }
  }

  const document = await (prisma as any).studentDocument.create({
    data: {
      instituteId: current.instituteId,
      studentId: current.id,
      title: data.title,
      documentType: data.documentType,
      fileAssetId: data.fileAssetId,
      metadata: data.metadata,
      verified: false,
    },
    include: {
      fileAsset: true,
    },
  });

  return document;
};

/**
 * Removes a document from the student's profile.
 */
const removeDocument = async (ctx: any, documentId: string) => {
  const current = await getMyProfile(ctx);

  const doc = await (prisma as any).studentDocument.findFirst({
    where: {
      id: documentId,
      studentId: current.id,
    },
  });

  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  await (prisma as any).studentDocument.delete({
    where: { id: documentId },
  });

  return {
    success: true,
    message: "Document removed successfully.",
  };
};

/**
 * Updates notification preferences for the authenticated student.
 */
const updateMyNotificationPrefs = async (ctx: any, notificationPrefs: any) => {
  const current = await getMyProfile(ctx);

  const updated = await (prisma as any).student.update({
    where: { id: current.id },
    data: { notificationPrefs },
  });

  return {
    success: true,
    notificationPrefs: updated.notificationPrefs,
  };
};

/**
 * Updates visibility preferences for the authenticated student.
 */
const updateMyVisibility = async (ctx: any, visibility: any) => {
  const current = await getMyProfile(ctx);

  const updated = await (prisma as any).student.update({
    where: { id: current.id },
    data: { visibility },
  });

  return {
    success: true,
    visibility: updated.visibility,
  };
};

const deleteById = async (id: string, ctx?: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  return (prisma as any).student.delete({
    where: whereConditions,
  });
};

export const StudentService = {
  create,
  getAll,
  getById,
  getStats,
  getMyProfile,
  updateMyProfile,
  adminUpdateProfile,
  uploadProfilePhoto,
  addDocument,
  removeDocument,
  updateMyNotificationPrefs,
  updateMyVisibility,
  update: adminUpdateProfile,
  deleteById,
};

export default StudentService;
