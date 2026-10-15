import prisma from "../../config/prisma.js";
import ApiError from "../../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";
import { logAudit } from "../../utils/audit.js";

/**
 * Determines whether a viewer can see an attribute governed by a visibility level.
 *
 * Visibility levels:
 * - HIDDEN: Only visible to the owner (matching userId) or a Platform Admin.
 * - ENROLLED_STUDENTS: Visible to the owner, platform admin, or an active enrolled student within the same institute.
 * - MEMBERS: Visible to the owner, platform admin, or any authenticated active member of the same institute.
 * - PUBLIC: Visible to everyone.
 *
 * @param visibilityLevel The Visibility level ('HIDDEN' | 'ENROLLED_STUDENTS' | 'MEMBERS' | 'PUBLIC').
 * @param viewerCtx The auth context of the viewer (userId, instituteId, isPlatformAdmin, etc.).
 * @param owner The entity or user owning the attribute ({ userId?: string; instituteId?: string; id?: string }).
 * @returns {Promise<boolean>} True if viewer is authorized to see the attribute, false otherwise.
 */
export const canViewerSee = async (
  visibilityLevel: string | undefined | null,
  viewerCtx: any,
  owner?: { userId?: string; instituteId?: string; id?: string },
): Promise<boolean> => {
  // Platform Super Admin bypasses all visibility restrictions
  if (viewerCtx?.isPlatformAdmin) {
    return true;
  }

  // Owner always sees their own profile and attributes
  if (
    (owner?.userId && viewerCtx?.userId && owner.userId === viewerCtx.userId) ||
    (owner?.id && viewerCtx?.userId && owner.id === viewerCtx.userId)
  ) {
    return true;
  }

  const level = visibilityLevel || "MEMBERS";

  // HIDDEN attributes are strictly invisible to anyone other than the owner / super admin
  if (level === "HIDDEN") {
    return false;
  }

  // PUBLIC attributes are visible to everyone
  if (level === "PUBLIC") {
    return true;
  }

  // Tenant boundary check: viewer must belong to the owner's institute
  if (owner?.instituteId && viewerCtx?.instituteId && owner.instituteId !== viewerCtx.instituteId) {
    return false;
  }

  // Unauthenticated viewers cannot access MEMBERS or ENROLLED_STUDENTS
  if (!viewerCtx?.userId) {
    return false;
  }

  // MEMBERS: any authenticated user belonging to the tenant institute
  if (level === "MEMBERS") {
    return true;
  }

  // ENROLLED_STUDENTS: viewer must be an active student with active enrollment in the same institute
  if (level === "ENROLLED_STUDENTS") {
    if (typeof viewerCtx?.isEnrolledStudent === "boolean") {
      return viewerCtx.isEnrolledStudent;
    }

    try {
      const student = await (prisma as any).student.findFirst({
        where: {
          userId: viewerCtx.userId,
          instituteId: owner?.instituteId || viewerCtx.instituteId,
          status: "ACTIVE",
          OR: [
            { academicEnrollments: { some: { status: "ACTIVE" } } },
            { courseEnrollments: { some: { status: "ACTIVE" } } },
          ],
        },
        select: { id: true },
      });

      return !!student;
    } catch {
      return false;
    }
  }

  return false;
};

/**
 * Strips hidden fields from a teacher profile based on field-level visibility preferences.
 * Must be the ONLY serialization path used by student-facing and public directory endpoints.
 *
 * @param teacher Full teacher profile with relations (user, qualifications, photo, etc.).
 * @param viewerCtx Authentication context of the requesting client.
 * @returns {Promise<any>} Sanitized teacher profile object.
 */
export const serializeTeacherForViewer = async (teacher: any, viewerCtx: any): Promise<any> => {
  if (!teacher) return null;

  const owner = {
    userId: teacher.userId,
    instituteId: teacher.instituteId,
    id: teacher.id,
  };

  const isOwner =
    Boolean(viewerCtx?.userId && (viewerCtx.userId === teacher.userId || viewerCtx.userId === teacher.id)) ||
    Boolean(viewerCtx?.isPlatformAdmin);

  const vis = teacher.visibility && typeof teacher.visibility === "object" ? teacher.visibility : {};

  const serialized: any = {
    id: teacher.id,
    instituteId: teacher.instituteId,
    userId: teacher.userId,
    employeeCode: teacher.employeeCode,
    bio: teacher.bio,
    headline: teacher.headline,
    languages: teacher.languages,
    acceptsSupportSessions: teacher.acceptsSupportSessions,
    department: teacher.department,
    designation: teacher.designation,
    photoFileAsset: teacher.photoFileAsset,
    qualifications: teacher.qualifications,
  };

  if (teacher.user) {
    serialized.user = {
      id: teacher.user.id,
      firstName: teacher.user.firstName,
      lastName: teacher.user.lastName,
      avatarUrl: teacher.user.avatarUrl,
    };
  }

  // Phone visibility
  const canSeePhone = await canViewerSee(vis.phone ?? "HIDDEN", viewerCtx, owner);
  if (canSeePhone) {
    if (teacher.officePhone) serialized.officePhone = teacher.officePhone;
    if (teacher.user?.phone && serialized.user) serialized.user.phone = teacher.user.phone;
  }

  // Email visibility
  const canSeeEmail = await canViewerSee(vis.email ?? (teacher.publicEmail ? "PUBLIC" : "MEMBERS"), viewerCtx, owner);
  if (canSeeEmail) {
    if (teacher.publicEmail) serialized.publicEmail = teacher.publicEmail;
    if (teacher.user?.email && serialized.user) serialized.user.email = teacher.user.email;
  }

  // Office hours visibility
  const canSeeOfficeHours = await canViewerSee(vis.officeHours ?? "ENROLLED_STUDENTS", viewerCtx, owner);
  if (canSeeOfficeHours && teacher.officeHours) {
    serialized.officeHours = teacher.officeHours;
  }

  // Office room visibility
  const canSeeOfficeRoom = await canViewerSee(vis.officeRoom ?? "MEMBERS", viewerCtx, owner);
  if (canSeeOfficeRoom && teacher.officeRoom) {
    serialized.officeRoom = teacher.officeRoom;
  }

  // Default meeting URL visibility
  const canSeeMeetingUrl = await canViewerSee(vis.defaultMeetingUrl ?? "ENROLLED_STUDENTS", viewerCtx, owner);
  if (canSeeMeetingUrl && teacher.defaultMeetingUrl) {
    serialized.defaultMeetingUrl = teacher.defaultMeetingUrl;
  }

  // Social links visibility
  const canSeeSocial = await canViewerSee(vis.socialLinks ?? "PUBLIC", viewerCtx, owner);
  if (canSeeSocial && teacher.socialLinks) {
    serialized.socialLinks = teacher.socialLinks;
  }

  // Address visibility (defaults to HIDDEN)
  const canSeeAddress = await canViewerSee(vis.address ?? "HIDDEN", viewerCtx, owner);
  if (canSeeAddress && teacher.address) {
    serialized.address = teacher.address;
  }

  // National ID visibility (defaults to HIDDEN)
  const canSeeNationalId = await canViewerSee(vis.nationalId ?? "HIDDEN", viewerCtx, owner);
  if (canSeeNationalId && teacher.nationalId) {
    serialized.nationalId = teacher.nationalId;
  }

  // Only the owner or platform admin can view raw visibility configuration
  if (isOwner) {
    serialized.visibility = teacher.visibility;
  }

  return serialized;
};

/**
 * Strips hidden fields from a staff profile based on field-level visibility preferences.
 * Must be the ONLY serialization path used by student-facing and public directory endpoints.
 *
 * @param staff Full staff profile with relations (user, photo, department, etc.).
 * @param viewerCtx Authentication context of the requesting client.
 * @returns {Promise<any>} Sanitized staff profile object.
 */
export const serializeStaffForViewer = async (staff: any, viewerCtx: any): Promise<any> => {
  if (!staff) return null;

  const owner = {
    userId: staff.userId,
    instituteId: staff.instituteId,
    id: staff.id,
  };

  const isOwner =
    Boolean(viewerCtx?.userId && (viewerCtx.userId === staff.userId || viewerCtx.userId === staff.id)) ||
    Boolean(viewerCtx?.isPlatformAdmin);

  const vis = staff.visibility && typeof staff.visibility === "object" ? staff.visibility : {};

  const serialized: any = {
    id: staff.id,
    instituteId: staff.instituteId,
    userId: staff.userId,
    employeeCode: staff.employeeCode,
    staffType: staff.staffType,
    department: staff.department,
    designation: staff.designation,
    acceptsSupportSessions: staff.acceptsSupportSessions,
    photoFileAsset: staff.photoFileAsset,
  };

  if (staff.user) {
    serialized.user = {
      id: staff.user.id,
      firstName: staff.user.firstName,
      lastName: staff.user.lastName,
      avatarUrl: staff.user.avatarUrl,
    };
  }

  // Phone visibility
  const canSeePhone = await canViewerSee(vis.phone ?? "MEMBERS", viewerCtx, owner);
  if (canSeePhone) {
    if (staff.phone) serialized.phone = staff.phone;
    if (staff.user?.phone && serialized.user) serialized.user.phone = staff.user.phone;
  }

  // Email visibility
  const canSeeEmail = await canViewerSee(vis.email ?? "MEMBERS", viewerCtx, owner);
  if (canSeeEmail && staff.user?.email && serialized.user) {
    serialized.user.email = staff.user.email;
  }

  // Address visibility (defaults to HIDDEN)
  const canSeeAddress = await canViewerSee(vis.address ?? "HIDDEN", viewerCtx, owner);
  if (canSeeAddress && staff.address) {
    serialized.address = staff.address;
  }

  // Emergency contact visibility (defaults to HIDDEN)
  const canSeeEmergency = await canViewerSee(vis.emergencyContact ?? "HIDDEN", viewerCtx, owner);
  if (canSeeEmergency && staff.emergencyContact) {
    serialized.emergencyContact = staff.emergencyContact;
  }

  // Default meeting URL visibility
  const canSeeMeetingUrl = await canViewerSee(vis.defaultMeetingUrl ?? "MEMBERS", viewerCtx, owner);
  if (canSeeMeetingUrl && staff.defaultMeetingUrl) {
    serialized.defaultMeetingUrl = staff.defaultMeetingUrl;
  }

  if (isOwner) {
    serialized.visibility = staff.visibility;
  }

  return serialized;
};

/**
 * Strips hidden fields from institute public profile and contact attributes.
 *
 * @param institute Full institute record with publicProfile relation.
 * @param viewerCtx Authentication context of the requesting client.
 * @returns {Promise<any>} Sanitized institute profile object.
 */
export const serializeInstituteForViewer = async (institute: any, viewerCtx: any): Promise<any> => {
  if (!institute) return null;

  const owner = { instituteId: institute.id };
  const profile = institute.publicProfile;
  const contactVis = profile?.contactVisibility && typeof profile.contactVisibility === "object"
    ? profile.contactVisibility
    : {};

  const serialized: any = {
    id: institute.id,
    name: institute.name,
    legalName: institute.legalName,
    code: institute.code,
    slug: institute.slug,
    logoUrl: institute.logoUrl,
    faviconUrl: institute.faviconUrl,
    website: institute.website,
    country: institute.country,
    timezone: institute.timezone,
    currency: institute.currency,
    locale: institute.locale,
    about: profile?.about,
    mission: profile?.mission,
    gallery: profile?.gallery,
    facilities: profile?.facilities,
    socialLinks: profile?.socialLinks,
    workingHours: profile?.workingHours,
    mapLocation: profile?.mapLocation,
  };

  // Phone visibility (defaults to PUBLIC unless configured otherwise)
  const canSeePhone = await canViewerSee(contactVis.phone ?? "PUBLIC", viewerCtx, owner);
  if (canSeePhone) {
    if (institute.phone) serialized.phone = institute.phone;
    if (institute.alternatePhone) serialized.alternatePhone = institute.alternatePhone;
  }

  // Email visibility (defaults to PUBLIC unless configured otherwise)
  const canSeeEmail = await canViewerSee(contactVis.email ?? "PUBLIC", viewerCtx, owner);
  if (canSeeEmail && institute.email) {
    serialized.email = institute.email;
  }

  // Address visibility (defaults to PUBLIC unless configured otherwise)
  const canSeeAddress = await canViewerSee(contactVis.address ?? "PUBLIC", viewerCtx, owner);
  if (canSeeAddress) {
    if (institute.address) serialized.address = institute.address;
    if (institute.district) serialized.district = institute.district;
    if (institute.division) serialized.division = institute.division;
    if (institute.postalCode) serialized.postalCode = institute.postalCode;
  }

  return serialized;
};

/**
 * Updates teacher visibility settings for the authenticated teacher.
 */
export const updateTeacherVisibility = async (ctx: any, visibility: Record<string, any>) => {
  if (!ctx?.userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication required.");
  }

  const whereConditions: any = { userId: ctx.userId };
  if (ctx.instituteId) {
    whereConditions.instituteId = ctx.instituteId;
  }

  const teacher = await (prisma as any).teacherProfile.findFirst({
    where: whereConditions,
  });

  if (!teacher) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Teacher profile not found for this user.");
  }

  const updated = await (prisma as any).teacherProfile.update({
    where: { id: teacher.id },
    data: { visibility },
  });

  await logAudit({
    ctx,
    action: "TEACHER_VISIBILITY_UPDATE",
    entityType: "TeacherProfile",
    entityId: teacher.id,
    oldValue: { visibility: teacher.visibility },
    newValue: { visibility: updated.visibility },
  });

  return {
    success: true,
    visibility: updated.visibility,
  };
};

/**
 * Updates institute contact visibility and public profile settings.
 */
export const updateInstituteContactVisibility = async (ctx: any, contactVisibility: Record<string, any>) => {
  if (!ctx?.instituteId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Institute context required.");
  }

  const existing = await (prisma as any).institutePublicProfile.findUnique({
    where: { instituteId: ctx.instituteId },
  });

  const updated = await (prisma as any).institutePublicProfile.upsert({
    where: { instituteId: ctx.instituteId },
    create: {
      instituteId: ctx.instituteId,
      contactVisibility,
    },
    update: {
      contactVisibility,
    },
  });

  await logAudit({
    ctx,
    action: "INSTITUTE_CONTACT_VISIBILITY_UPDATE",
    entityType: "InstitutePublicProfile",
    entityId: updated.id,
    oldValue: existing ? { contactVisibility: existing.contactVisibility } : null,
    newValue: { contactVisibility: updated.contactVisibility },
  });

  return {
    success: true,
    contactVisibility: updated.contactVisibility,
  };
};

export const VisibilityService = {
  canViewerSee,
  serializeTeacherForViewer,
  serializeStaffForViewer,
  serializeInstituteForViewer,
  updateTeacherVisibility,
  updateInstituteContactVisibility,
};

export default VisibilityService;
