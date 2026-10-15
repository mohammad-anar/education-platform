import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { prismaHelper } from "../../../utils/prismaHelper.js";
import { ITeacherFilterRequest } from "./teacher.interface.js";
import { logAudit } from "../../../utils/audit.js";
import { enforcePlanLimit } from "../../platform-admin/platform-admin.service.js";

const create = async (payload: any, ctx?: any) => {
  const targetInstituteId = ctx?.instituteId || payload.instituteId;
  if (targetInstituteId) {
    await enforcePlanLimit(targetInstituteId, "teacher");
  }

  return (prisma as any).teacherProfile.create({
    data: payload,
    include: { user: true },
  });
};

const getAll = async (
  filters: ITeacherFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { searchTerm, instituteId, employmentStatus, designation, ...filterData } = filters as any;
  const targetInstituteId = ctx?.instituteId && !ctx?.isPlatformAdmin ? ctx.instituteId : instituteId;

  const whereConditions: any = {
    ...prismaHelper.buildFilterCondition(filterData),
    ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
    ...(employmentStatus ? { employmentStatus } : {}),
    ...(designation ? { designation } : {}),
    ...(searchTerm
      ? {
          OR: [
            { employeeCode: { contains: searchTerm, mode: "insensitive" } },
            { designation: { contains: searchTerm, mode: "insensitive" } },
            { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
            { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
            { user: { email: { contains: searchTerm, mode: "insensitive" } } },
            { user: { phone: { contains: searchTerm, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prismaHelper.findManyPaginated((prisma as any).teacherProfile, {
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
      courseAssignments: {
        where: { isPrimary: true },
        include: { course: true },
      },
      classAssignments: {
        where: { isClassTeacher: true },
        include: { classGroup: true, section: true },
      },
    },
  });
};

const getById = async (id: string, ctx?: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).teacherProfile.findFirst({
    where: whereConditions,
    include: {
      user: true,
      photoFileAsset: true,
      qualifications: {
        include: { fileAsset: true },
      },
      courseAssignments: { include: { course: true } },
      classAssignments: { include: { classGroup: true, section: true } },
      classRoutines: true,
      liveClasses: true,
    },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Teacher not found.");
  }

  return result;
};

/**
 * Retrieves the teacher profile for the currently authenticated user.
 */
const getMyProfile = async (ctx: any) => {
  if (!ctx?.userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required.");
  }

  const whereConditions: any = { userId: ctx.userId };
  if (ctx.instituteId) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const teacher = await (prisma as any).teacherProfile.findFirst({
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
      qualifications: {
        include: { fileAsset: true },
      },
      courseAssignments: { include: { course: true } },
      classAssignments: { include: { classGroup: true, section: true } },
    },
  });

  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Teacher profile not found for this user.");
  }

  return teacher;
};

/**
 * Updates self-editable profile fields for the authenticated teacher.
 */
const updateMyProfile = async (ctx: any, data: any) => {
  const current = await getMyProfile(ctx);

  const updated = await (prisma as any).teacherProfile.update({
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
 * Administrator updates a teacher profile with diff auditing.
 */
const adminUpdateProfile = async (ctx: any, id: string, data: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const oldTeacher = await (prisma as any).teacherProfile.findFirst({
    where: whereConditions,
  });

  if (!oldTeacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Teacher not found.");
  }

  const updated = await (prisma as any).teacherProfile.update({
    where: { id },
    data,
    include: { user: true, photoFileAsset: true },
  });

  await logAudit({
    ctx,
    action: "TEACHER_PROFILE_UPDATE",
    entityType: "TeacherProfile",
    entityId: id,
    oldValue: oldTeacher,
    newValue: updated,
  });

  return updated;
};

/**
 * Uploads or links profile photo for teacher.
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

  const updated = await (prisma as any).teacherProfile.update({
    where: { id: current.id },
    data: { photoFileAssetId: fileAssetId },
    include: { photoFileAsset: true },
  });

  return updated;
};

/**
 * Adds an academic qualification to the teacher's profile.
 */
const addQualification = async (ctx: any, data: any) => {
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

  const qualification = await (prisma as any).teacherQualification.create({
    data: {
      instituteId: current.instituteId,
      teacherProfileId: current.id,
      degree: data.degree,
      fieldOfStudy: data.fieldOfStudy,
      institution: data.institution,
      passingYear: data.passingYear,
      grade: data.grade,
      fileAssetId: data.fileAssetId,
      metadata: data.metadata,
      verified: false,
    },
    include: {
      fileAsset: true,
    },
  });

  return qualification;
};

/**
 * Removes an academic qualification from the teacher's profile.
 */
const removeQualification = async (ctx: any, qualificationId: string) => {
  const current = await getMyProfile(ctx);

  const qual = await (prisma as any).teacherQualification.findFirst({
    where: {
      id: qualificationId,
      teacherProfileId: current.id,
    },
  });

  if (!qual) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Qualification not found.");
  }

  await (prisma as any).teacherQualification.delete({
    where: { id: qualificationId },
  });

  return {
    success: true,
    message: "Qualification removed successfully.",
  };
};

/**
 * Updates notification preferences for the authenticated teacher.
 */
const updateMyNotificationPrefs = async (ctx: any, notificationPrefs: any) => {
  const current = await getMyProfile(ctx);

  const updated = await (prisma as any).teacherProfile.update({
    where: { id: current.id },
    data: { notificationPrefs },
  });

  return {
    success: true,
    notificationPrefs: updated.notificationPrefs,
  };
};

/**
 * Updates visibility preferences for the authenticated teacher.
 */
const updateMyVisibility = async (ctx: any, visibility: any) => {
  const current = await getMyProfile(ctx);

  const updated = await (prisma as any).teacherProfile.update({
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

  return (prisma as any).teacherProfile.delete({
    where: whereConditions,
  });
};

export const TeacherService = {
  create,
  getAll,
  getById,
  getMyProfile,
  updateMyProfile,
  adminUpdateProfile,
  uploadProfilePhoto,
  addQualification,
  removeQualification,
  updateMyNotificationPrefs,
  updateMyVisibility,
  update: adminUpdateProfile,
  deleteById,
};

export default TeacherService;
