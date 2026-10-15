import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { IPaginationOptions } from "../../types/pagination.js";
import { prismaHelper } from "../../utils/prismaHelper.js";
import {
  serializeTeacherForViewer,
  serializeStaffForViewer,
  serializeInstituteForViewer,
  updateTeacherVisibility,
  updateInstituteContactVisibility,
} from "./visibility.service.js";

/**
 * Retrieves a paginated list of active teachers in the institute directory.
 * Every teacher profile is strictly processed through serializeTeacherForViewer to hide sensitive data.
 *
 * @param filters Search terms, subject filters, and department filters.
 * @param paginationOptions Page, limit, sortBy, and sortOrder.
 * @param viewerCtx Authentication context of the requesting user.
 */
const getTeachersDirectory = async (
  filters: {
    searchTerm?: string;
    subjectId?: string;
    departmentId?: string;
    designationId?: string;
    acceptsSupportSessions?: boolean | string;
  },
  paginationOptions: IPaginationOptions,
  viewerCtx: any,
) => {
  const { searchTerm, subjectId, departmentId, designationId, acceptsSupportSessions } = filters;

  const targetInstituteId = viewerCtx?.instituteId;
  if (!targetInstituteId && !viewerCtx?.isPlatformAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Institute context is required.");
  }

  const whereConditions: any = {
    employmentStatus: "ACTIVE",
    ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(designationId ? { designationId } : {}),
    ...(acceptsSupportSessions !== undefined
      ? { acceptsSupportSessions: acceptsSupportSessions === true || acceptsSupportSessions === "true" }
      : {}),
  };

  // Subject filtering: checks either class routines or course assignments
  if (subjectId) {
    whereConditions.OR = [
      { classRoutines: { some: { subjectId, status: "ACTIVE" } } },
      { courseAssignments: { some: { course: { subjectId } } } },
    ];
  }

  // Text search condition
  if (searchTerm) {
    const textSearchCondition = {
      OR: [
        { headline: { contains: searchTerm, mode: "insensitive" } },
        { bio: { contains: searchTerm, mode: "insensitive" } },
        { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
        { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
      ],
    };

    if (whereConditions.OR) {
      whereConditions.AND = [{ OR: whereConditions.OR }, textSearchCondition];
      delete whereConditions.OR;
    } else {
      whereConditions.OR = textSearchCondition.OR;
    }
  }

  const result = await prismaHelper.findManyPaginated((prisma as any).teacherProfile, {
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
      department: true,
      designation: true,
      qualifications: {
        where: { verified: true },
      },
    },
  });

  // Strictly serialize every teacher profile for the current viewer
  const sanitizedData = await Promise.all(
    result.data.map((teacher: any) => serializeTeacherForViewer(teacher, viewerCtx)),
  );

  return {
    meta: result.meta,
    data: sanitizedData,
  };
};

/**
 * Retrieves a single teacher's directory profile by ID.
 * Strictly processed through serializeTeacherForViewer.
 */
const getTeacherById = async (id: string, viewerCtx: any) => {
  const targetInstituteId = viewerCtx?.instituteId;

  const whereConditions: any = { id };
  if (targetInstituteId && !viewerCtx?.isPlatformAdmin) {
    whereConditions.instituteId = targetInstituteId;
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
        },
      },
      photoFileAsset: true,
      department: true,
      designation: true,
      qualifications: true,
      classRoutines: {
        where: { status: "ACTIVE" },
        include: { subject: true, classGroup: true },
      },
      courseAssignments: {
        include: { course: true },
      },
    },
  });

  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Teacher not found in directory.");
  }

  return serializeTeacherForViewer(teacher, viewerCtx);
};

/**
 * Retrieves a paginated list of active staff members in the institute directory.
 * Every staff profile is strictly processed through serializeStaffForViewer.
 */
const getStaffDirectory = async (
  filters: {
    searchTerm?: string;
    departmentId?: string;
    designationId?: string;
    staffType?: string;
    acceptsSupportSessions?: boolean | string;
  },
  paginationOptions: IPaginationOptions,
  viewerCtx: any,
) => {
  const { searchTerm, departmentId, designationId, staffType, acceptsSupportSessions } = filters;

  const targetInstituteId = viewerCtx?.instituteId;
  if (!targetInstituteId && !viewerCtx?.isPlatformAdmin) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Institute context is required.");
  }

  const whereConditions: any = {
    employmentStatus: "ACTIVE",
    ...(targetInstituteId ? { instituteId: targetInstituteId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(designationId ? { designationId } : {}),
    ...(staffType ? { staffType } : {}),
    ...(acceptsSupportSessions !== undefined
      ? { acceptsSupportSessions: acceptsSupportSessions === true || acceptsSupportSessions === "true" }
      : {}),
  };

  if (searchTerm) {
    whereConditions.OR = [
      { user: { firstName: { contains: searchTerm, mode: "insensitive" } } },
      { user: { lastName: { contains: searchTerm, mode: "insensitive" } } },
    ];
  }

  const result = await prismaHelper.findManyPaginated((prisma as any).staffProfile, {
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
      department: true,
      designation: true,
    },
  });

  const sanitizedData = await Promise.all(
    result.data.map((staff: any) => serializeStaffForViewer(staff, viewerCtx)),
  );

  return {
    meta: result.meta,
    data: sanitizedData,
  };
};

/**
 * Retrieves the public profile of the tenant institute.
 * Formatted and sanitized through serializeInstituteForViewer.
 */
const getInstitutePublicProfile = async (viewerCtx: any, explicitInstituteId?: string) => {
  const instituteId = explicitInstituteId || viewerCtx?.instituteId;
  if (!instituteId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Institute identifier is required.");
  }

  const institute = await (prisma as any).institute.findUnique({
    where: { id: instituteId },
    include: {
      publicProfile: true,
      settings: {
        select: {
          brandingSettings: true,
        },
      },
    },
  });

  if (!institute) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Institute not found.");
  }

  return serializeInstituteForViewer(institute, viewerCtx);
};

export const DirectoryService = {
  getTeachersDirectory,
  getTeacherById,
  getStaffDirectory,
  getInstitutePublicProfile,
  updateTeacherVisibility,
  updateInstituteContactVisibility,
};

export default DirectoryService;
