import ApiError from "../../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { prismaHelper } from "../../../utils/prismaHelper.js";
import { IStaffFilterRequest } from "./staff.interface.js";
import { logAudit } from "../../../utils/audit.js";

const create = async (payload: any, ctx?: any) => {
  return (prisma as any).staffProfile.create({
    data: payload,
    include: {
      user: true,
      department: true,
      designation: true,
    },
  });
};

const getAll = async (
  filters: IStaffFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any,
) => {
  const { searchTerm, instituteId, employmentStatus, departmentId, designationId, staffType, ...filterData } =
    filters as any;
  const targetInstituteId = ctx?.instituteId && !ctx?.isPlatformAdmin ? ctx.instituteId : instituteId;

  const whereConditions: any = {
    ...prismaHelper.buildFilterCondition(filterData),
    ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
    ...(employmentStatus ? { employmentStatus } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(designationId ? { designationId } : {}),
    ...(staffType ? { staffType } : {}),
    ...(searchTerm
      ? {
          OR: [
            { employeeCode: { contains: searchTerm, mode: "insensitive" } },
            { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
            { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
            { user: { email: { contains: searchTerm, mode: "insensitive" } } },
            { user: { phone: { contains: searchTerm, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  return prismaHelper.findManyPaginated((prisma as any).staffProfile, {
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
      department: true,
      designation: true,
      photoFileAsset: true,
    },
  });
};

const getById = async (id: string, ctx?: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const result = await (prisma as any).staffProfile.findFirst({
    where: whereConditions,
    include: {
      user: true,
      department: true,
      designation: true,
      photoFileAsset: true,
      documents: {
        include: { fileAsset: true },
      },
    },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Staff member not found.");
  }

  return result;
};

/**
 * Retrieves the staff profile for the currently authenticated user.
 */
const getMyProfile = async (ctx: any) => {
  if (!ctx?.userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required.");
  }

  const whereConditions: any = { userId: ctx.userId };
  if (ctx.instituteId) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const staff = await (prisma as any).staffProfile.findFirst({
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
      department: true,
      designation: true,
      photoFileAsset: true,
      documents: {
        include: { fileAsset: true },
      },
    },
  });

  if (!staff) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Staff profile not found for this user.");
  }

  return staff;
};

/**
 * Updates self-editable profile fields for the authenticated staff member.
 */
const updateMyProfile = async (ctx: any, data: any) => {
  const current = await getMyProfile(ctx);

  const updated = await (prisma as any).staffProfile.update({
    where: { id: current.id },
    data,
    include: {
      user: true,
      department: true,
      designation: true,
      photoFileAsset: true,
    },
  });

  return updated;
};

/**
 * Administrator updates a staff profile with diff auditing.
 */
const adminUpdateProfile = async (ctx: any, id: string, data: any) => {
  const whereConditions: any = { id };
  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const oldStaff = await (prisma as any).staffProfile.findFirst({
    where: whereConditions,
  });

  if (!oldStaff) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Staff profile not found.");
  }

  const updated = await (prisma as any).staffProfile.update({
    where: { id },
    data,
    include: { user: true, department: true, designation: true, photoFileAsset: true },
  });

  await logAudit({
    ctx,
    action: "STAFF_PROFILE_UPDATE",
    entityType: "StaffProfile",
    entityId: id,
    oldValue: oldStaff,
    newValue: updated,
  });

  return updated;
};

/**
 * Uploads or links profile photo for staff member.
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

  const updated = await (prisma as any).staffProfile.update({
    where: { id: current.id },
    data: { photoFileAssetId: fileAssetId },
    include: { photoFileAsset: true },
  });

  return updated;
};

/**
 * Adds a document to the staff member's profile.
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

  const document = await (prisma as any).staffDocument.create({
    data: {
      instituteId: current.instituteId,
      staffProfileId: current.id,
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
 * Removes a document from the staff member's profile.
 */
const removeDocument = async (ctx: any, documentId: string) => {
  const current = await getMyProfile(ctx);

  const doc = await (prisma as any).staffDocument.findFirst({
    where: {
      id: documentId,
      staffProfileId: current.id,
    },
  });

  if (!doc) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  await (prisma as any).staffDocument.delete({
    where: { id: documentId },
  });

  return {
    success: true,
    message: "Document removed successfully.",
  };
};

/**
 * Updates notification preferences for the authenticated staff member.
 */
const updateMyNotificationPrefs = async (ctx: any, notificationPrefs: any) => {
  const current = await getMyProfile(ctx);

  const existingMeta =
    current.metadata && typeof current.metadata === "object" ? current.metadata : {};
  const metadata = { ...existingMeta, notificationPrefs };

  const updated = await (prisma as any).staffProfile.update({
    where: { id: current.id },
    data: { metadata },
  });

  return {
    success: true,
    notificationPrefs,
  };
};

/**
 * Updates visibility preferences for the authenticated staff member.
 */
const updateMyVisibility = async (ctx: any, visibility: any) => {
  const current = await getMyProfile(ctx);

  const updated = await (prisma as any).staffProfile.update({
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

  return (prisma as any).staffProfile.delete({
    where: whereConditions,
  });
};

export const StaffService = {
  create,
  getAll,
  getById,
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

export default StaffService;
