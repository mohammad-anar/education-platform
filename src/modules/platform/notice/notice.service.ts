import { StatusCodes } from "http-status-codes";
import prisma from "../../../config/prisma.js";
import ApiError from "../../../utils/ApiError.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelpers } from "../../../utils/pagination.js";
import { logAudit } from "../../../utils/audit.js";
import {
  ICreateNoticePayload,
  IUpdateNoticePayload,
  INoticeFilterRequest,
  IMyNoticeFilterQuery,
} from "./notice.interface.js";
import { NoticeAudienceType } from "@prisma/client";
import { notificationsQueue } from "../../../queues/notification.queue.js";
import { domainEventEmitter } from "../../../events/index.js";
import { DomainEventType } from "../../../events/event-types.js";

/**
 * Resolves the audience users for a notice across all supported targeting criteria:
 * INSTITUTE, PROGRAM, LEVEL, CLASS, SECTION, COURSE, ROLE, and USER.
 *
 * @param notice The notice with audience targets.
 * @returns {Promise<string[]>} List of unique target user IDs.
 */
export async function resolveAudienceUsers(notice: {
  id?: string;
  instituteId: string;
  audiences?: { type: NoticeAudienceType; targetId?: string | null }[];
}): Promise<string[]> {
  const audiences = notice.audiences || [];

  // If no audiences specified, or if targeted to the whole institute without restriction
  const hasInstituteWide =
    audiences.length === 0 ||
    audiences.some(
      (a) => a.type === "INSTITUTE" && (!a.targetId || a.targetId === notice.instituteId)
    );

  if (hasInstituteWide) {
    const members = await prisma.instituteMembership.findMany({
      where: { instituteId: notice.instituteId, status: "ACTIVE" },
      select: { userId: true },
    });
    return members.map((m) => m.userId);
  }

  const userIdSet = new Set<string>();

  for (const aud of audiences) {
    if (!aud.targetId) continue;

    switch (aud.type) {
      case "USER":
        userIdSet.add(aud.targetId);
        break;

      case "ROLE": {
        const role = await prisma.role.findFirst({
          where: {
            instituteId: notice.instituteId,
            OR: [{ code: aud.targetId }, { id: aud.targetId }],
          },
          select: { id: true },
        });
        if (role) {
          const userRoles = await prisma.userRole.findMany({
            where: { roleId: role.id },
            select: { userId: true },
          });
          userRoles.forEach((ur) => userIdSet.add(ur.userId));
        }
        break;
      }

      case "COURSE": {
        const enrollments = await prisma.courseEnrollment.findMany({
          where: {
            instituteId: notice.instituteId,
            courseId: aud.targetId,
            status: "ACTIVE",
          },
          select: { student: { select: { userId: true } } },
        });
        enrollments.forEach((e) => {
          if (e.student.userId) userIdSet.add(e.student.userId);
        });
        break;
      }

      case "SECTION": {
        const enrollments = await prisma.studentAcademicEnrollment.findMany({
          where: {
            sectionId: aud.targetId,
            status: "ACTIVE",
            student: { instituteId: notice.instituteId },
          },
          include: { student: { select: { userId: true } } },
        });
        enrollments.forEach((e) => {
          if (e.student?.userId) userIdSet.add(e.student.userId);
        });
        break;
      }

      case "CLASS": {
        const enrollments = await prisma.studentAcademicEnrollment.findMany({
          where: {
            classGroupId: aud.targetId,
            status: "ACTIVE",
            student: { instituteId: notice.instituteId },
          },
          include: { student: { select: { userId: true } } },
        });
        enrollments.forEach((e) => {
          if (e.student?.userId) userIdSet.add(e.student.userId);
        });
        break;
      }

      case "LEVEL": {
        const enrollments = await prisma.studentAcademicEnrollment.findMany({
          where: {
            classGroup: { levelId: aud.targetId },
            status: "ACTIVE",
            student: { instituteId: notice.instituteId },
          },
          include: { student: { select: { userId: true } } },
        });
        enrollments.forEach((e) => {
          if (e.student?.userId) userIdSet.add(e.student.userId);
        });
        break;
      }

      case "PROGRAM": {
        const enrollments = await prisma.studentAcademicEnrollment.findMany({
          where: {
            programId: aud.targetId,
            status: "ACTIVE",
            student: { instituteId: notice.instituteId },
          },
          include: { student: { select: { userId: true } } },
        });
        enrollments.forEach((e) => {
          if (e.student?.userId) userIdSet.add(e.student.userId);
        });
        break;
      }
    }
  }

  return Array.from(userIdSet);
}

/**
 * Fans out in-app notifications to all targeted users when a notice is published.
 */
export async function fanOutNoticeNotifications(notice: {
  id: string;
  instituteId: string;
  title: string;
  content: string;
  createdById?: string | null;
  audiences?: any[];
}) {
  try {
    const targetedUserIds = await resolveAudienceUsers(notice);
    const recipientIds = notice.createdById
      ? targetedUserIds.filter((uid) => uid !== notice.createdById)
      : targetedUserIds;

    if (recipientIds.length === 0) return;

    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        instituteId: notice.instituteId,
        type: "NOTICE",
        title: `Notice: ${notice.title}`,
        message: notice.content.slice(0, 150),
        channel: "IN_APP",
        data: { noticeId: notice.id },
      })),
      skipDuplicates: true,
    });
  } catch (err) {
    console.error("Failed to fan-out notice notifications:", err);
  }
}

/**
 * Fans out in-app notifications to all targeted users via the background queue,
 * with graceful fallback to inline execution if queue is unavailable.
 */
export async function enqueueNoticeFanout(notice: {
  id: string;
  instituteId: string;
  title: string;
  content: string;
  createdById?: string | null;
}) {
  try {
    await notificationsQueue.add(
      "notice_fanout",
      {
        noticeId: notice.id,
        instituteId: notice.instituteId,
        title: notice.title,
        content: notice.content,
        createdById: notice.createdById,
      },
      { jobId: `notice:${notice.id}` },
    );
  } catch (err) {
    // Graceful fallback to direct execution
    await fanOutNoticeNotifications(notice);
  }

  // Emit domain event for analytics tracking
  domainEventEmitter.emit(DomainEventType.NOTICE_PUBLISHED, {
    instituteId: notice.instituteId,
    actorId: notice.createdById,
    eventType: DomainEventType.NOTICE_PUBLISHED,
    entityType: "Notice",
    entityId: notice.id,
    properties: { title: notice.title },
  });
}

/**
 * Creates a new notice with optional audience targeting and immediate publishing.
 */
export async function createNotice(payload: ICreateNoticePayload, ctx: any) {
  const isPublishNow = payload.publishNow === true;
  const publishAt = isPublishNow
    ? new Date()
    : payload.publishAt
    ? new Date(payload.publishAt)
    : new Date();

  const notice = await prisma.notice.create({
    data: {
      instituteId: ctx.instituteId,
      title: payload.title,
      content: payload.content,
      category: payload.category || "GENERAL",
      priority: payload.priority || 0,
      publishAt,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      pinned: payload.pinned || false,
      attachments: payload.attachments || null,
      status: "ACTIVE",
      createdById: ctx.userId,
      audiences: payload.audiences && payload.audiences.length > 0
        ? {
            create: payload.audiences.map((aud) => ({
              type: aud.type,
              targetId: aud.targetId || null,
            })),
          }
        : undefined,
    },
    include: {
      audiences: true,
    },
  });

  await logAudit({
    ctx,
    action: "NOTICE_CREATE",
    entityType: "Notice",
    entityId: notice.id,
    newValue: notice,
  });

  // Fan out notification via queue if notice is active and publish date is now or past
  if (notice.publishAt && notice.publishAt <= new Date()) {
    await enqueueNoticeFanout(notice);
  }

  return notice;
}

/**
 * Updates an existing notice and replaces audiences if specified.
 */
export async function updateNotice(id: string, payload: IUpdateNoticePayload, ctx: any) {
  const existing = await prisma.notice.findFirst({
    where: { id, instituteId: ctx.instituteId, deletedAt: null },
    include: { audiences: true },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  const updateData: any = {};
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.content !== undefined) updateData.content = payload.content;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.priority !== undefined) updateData.priority = payload.priority;
  if (payload.publishAt !== undefined) updateData.publishAt = payload.publishAt ? new Date(payload.publishAt) : null;
  if (payload.expiresAt !== undefined) updateData.expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  if (payload.pinned !== undefined) updateData.pinned = payload.pinned;
  if (payload.attachments !== undefined) updateData.attachments = payload.attachments;

  if (payload.audiences !== undefined) {
    await prisma.noticeAudience.deleteMany({ where: { noticeId: id } });
    if (payload.audiences.length > 0) {
      updateData.audiences = {
        create: payload.audiences.map((aud) => ({
          type: aud.type,
          targetId: aud.targetId || null,
        })),
      };
    }
  }

  const updated = await prisma.notice.update({
    where: { id },
    data: updateData,
    include: { audiences: true },
  });

  await logAudit({
    ctx,
    action: "NOTICE_UPDATE",
    entityType: "Notice",
    entityId: id,
    oldValue: existing,
    newValue: updated,
  });

  return updated;
}

/**
 * Publishes a notice and fans out in-app notifications.
 */
export async function publishNotice(id: string, ctx: any) {
  const notice = await prisma.notice.findFirst({
    where: { id, instituteId: ctx.instituteId, deletedAt: null },
    include: { audiences: true },
  });

  if (!notice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  const updated = await prisma.notice.update({
    where: { id },
    data: {
      status: "ACTIVE",
      publishAt: notice.publishAt && notice.publishAt <= new Date() ? notice.publishAt : new Date(),
    },
    include: { audiences: true },
  });

  await logAudit({
    ctx,
    action: "NOTICE_PUBLISH",
    entityType: "Notice",
    entityId: id,
    oldValue: { status: notice.status },
    newValue: { status: "ACTIVE" },
  });

  await enqueueNoticeFanout(updated);

  return updated;
}

/**
 * Unpublishes a notice (marks inactive).
 */
export async function unpublishNotice(id: string, ctx: any) {
  const notice = await prisma.notice.findFirst({
    where: { id, instituteId: ctx.instituteId, deletedAt: null },
  });

  if (!notice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  const updated = await prisma.notice.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  await logAudit({
    ctx,
    action: "NOTICE_UNPUBLISH",
    entityType: "Notice",
    entityId: id,
    oldValue: { status: notice.status },
    newValue: { status: "INACTIVE" },
  });

  return updated;
}

/**
 * Pins or unpins a notice to the top of the board.
 */
export async function pinNotice(id: string, pinned: boolean, ctx: any) {
  const notice = await prisma.notice.findFirst({
    where: { id, instituteId: ctx.instituteId, deletedAt: null },
  });

  if (!notice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  const updated = await prisma.notice.update({
    where: { id },
    data: { pinned },
  });

  await logAudit({
    ctx,
    action: "NOTICE_PIN",
    entityType: "Notice",
    entityId: id,
    oldValue: { pinned: notice.pinned },
    newValue: { pinned },
  });

  return updated;
}

/**
 * Soft deletes a notice.
 */
export async function deleteNotice(id: string, ctx: any) {
  const notice = await prisma.notice.findFirst({
    where: { id, instituteId: ctx.instituteId, deletedAt: null },
  });

  if (!notice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  const updated = await prisma.notice.update({
    where: { id },
    data: {
      status: "DELETED",
      deletedAt: new Date(),
    },
  });

  await logAudit({
    ctx,
    action: "NOTICE_DELETE",
    entityType: "Notice",
    entityId: id,
    newValue: { deletedAt: updated.deletedAt },
  });

  return updated;
}

/**
 * Lists notices relevant to the authenticated user based on audience targeting,
 * ensuring students of one class/section never see notices targeted exclusively to another.
 */
export async function listMyNotices(ctx: any, query: IMyNoticeFilterQuery) {
  const userId = ctx.userId;
  const instituteId = ctx.instituteId;
  const now = new Date();

  // 1. Gather all audience conditions matching this user
  const audienceConditions: any[] = [
    { type: "INSTITUTE" },
    { type: "USER", targetId: userId },
  ];

  // User's active roles in the institute
  const userRoles = await prisma.userRole.findMany({
    where: {
      userId,
      role: { instituteId },
    },
    include: { role: { select: { id: true, code: true } } },
  });

  const roleCodesAndIds = userRoles.flatMap((ur) => [ur.role.id, ur.role.code]);
  if (roleCodesAndIds.length > 0) {
    audienceConditions.push({ type: "ROLE", targetId: { in: roleCodesAndIds } });
  }

  // Student enrollments
  const student = await prisma.student.findFirst({
    where: { userId, instituteId },
    select: { id: true },
  });

  if (student) {
    const academicEnrollments = await prisma.studentAcademicEnrollment.findMany({
      where: { studentId: student.id, status: "ACTIVE" },
      include: { classGroup: { select: { levelId: true } } },
    });

    const programIds = Array.from(new Set(academicEnrollments.map((e) => e.programId).filter(Boolean)));
    const levelIds = Array.from(new Set(academicEnrollments.map((e) => e.classGroup?.levelId).filter(Boolean)));
    const classGroupIds = Array.from(new Set(academicEnrollments.map((e) => e.classGroupId).filter(Boolean)));
    const sectionIds = Array.from(new Set(academicEnrollments.map((e) => e.sectionId).filter(Boolean)));

    if (programIds.length > 0) audienceConditions.push({ type: "PROGRAM", targetId: { in: programIds as string[] } });
    if (levelIds.length > 0) audienceConditions.push({ type: "LEVEL", targetId: { in: levelIds as string[] } });
    if (classGroupIds.length > 0) audienceConditions.push({ type: "CLASS", targetId: { in: classGroupIds as string[] } });
    if (sectionIds.length > 0) audienceConditions.push({ type: "SECTION", targetId: { in: sectionIds as string[] } });

    // Course enrollments
    const courseEnrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: student.id, instituteId, status: "ACTIVE" },
      select: { courseId: true },
    });
    const courseIds = Array.from(new Set(courseEnrollments.map((e) => e.courseId)));
    if (courseIds.length > 0) audienceConditions.push({ type: "COURSE", targetId: { in: courseIds } });
  }

  // 2. Query active notices that match the user's audiences
  const where: any = {
    instituteId,
    deletedAt: null,
    status: "ACTIVE",
    publishAt: { lte: now },
    AND: [
      {
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: now } },
        ],
      },
      {
        OR: [
          { audiences: { none: {} } },
          { audiences: { some: { OR: audienceConditions } } },
        ],
      },
    ],
  };

  if (query.unreadOnly === true || String(query.unreadOnly) === "true") {
    where.reads = { none: { userId } };
  }

  if (query.category) {
    where.category = query.category;
  }

  if (query.search) {
    where.AND.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { content: { contains: query.search, mode: "insensitive" } },
      ],
    });
  }

  const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
  let cursorObj: any = undefined;
  if (query.cursor) {
    cursorObj = { id: query.cursor };
  }

  const notices = await prisma.notice.findMany({
    where,
    take: limit + 1,
    skip: cursorObj ? 1 : 0,
    cursor: cursorObj,
    orderBy: [
      { pinned: "desc" },
      { publishAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      audiences: true,
      reads: {
        where: { userId },
        select: { readAt: true },
      },
    },
  });

  let nextCursor: string | null = null;
  if (notices.length > limit) {
    const nextItem = notices.pop();
    nextCursor = nextItem?.id || null;
  }

  const data = notices.map((n) => {
    const isRead = n.reads.length > 0;
    const readAt = isRead ? n.reads[0].readAt : null;
    const { reads, ...rest } = n;
    return {
      ...rest,
      isRead,
      readAt,
    };
  });

  return { data, nextCursor };
}

/**
 * Marks a notice as read by the authenticated user.
 */
export async function markRead(ctx: any, noticeId: string) {
  const notice = await prisma.notice.findFirst({
    where: { id: noticeId, instituteId: ctx.instituteId, deletedAt: null },
  });

  if (!notice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  const readRecord = await prisma.noticeRead.upsert({
    where: {
      noticeId_userId: {
        noticeId,
        userId: ctx.userId,
      },
    },
    create: {
      noticeId,
      userId: ctx.userId,
      readAt: new Date(),
    },
    update: {
      readAt: new Date(),
    },
  });

  return readRecord;
}

/**
 * Returns unread notice count for the authenticated user.
 */
export async function getUnreadCount(ctx: any) {
  const myNoticesResult = await listMyNotices(ctx, { unreadOnly: true, limit: 100 });
  return {
    unreadCount: myNoticesResult.data.length,
  };
}

/**
 * Returns read engagement stats for a notice (admin audit).
 */
export async function getNoticeReadStats(id: string, ctx: any) {
  const notice = await prisma.notice.findFirst({
    where: { id, instituteId: ctx.instituteId, deletedAt: null },
    include: { audiences: true },
  });

  if (!notice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  const targetedUserIds = await resolveAudienceUsers(notice);
  const totalTargeted = targetedUserIds.length;

  const reads = await prisma.noticeRead.findMany({
    where: {
      noticeId: id,
      userId: { in: targetedUserIds },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          email: true,
        },
      },
    },
    orderBy: { readAt: "desc" },
  });

  const totalRead = reads.length;
  const readPercentage = totalTargeted > 0 ? Number(((totalRead / totalTargeted) * 100).toFixed(1)) : 0;

  return {
    noticeId: id,
    title: notice.title,
    totalTargeted,
    totalRead,
    readPercentage,
    reads,
  };
}

/**
 * Admin list of all notices with filtering and pagination.
 */
export async function getAll(
  filters: INoticeFilterRequest,
  paginationOptions: IPaginationOptions,
  ctx?: any
) {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const whereConditions: any = {
    deletedAt: null,
  };

  if (ctx?.instituteId && !ctx?.isPlatformAdmin) {
    whereConditions.instituteId = ctx.instituteId;
  }

  if (filters.status) whereConditions.status = filters.status;
  if (filters.category) whereConditions.category = filters.category;
  if (filters.pinned !== undefined) whereConditions.pinned = String(filters.pinned) === "true";

  if (filters.searchTerm) {
    whereConditions.OR = [
      { title: { contains: filters.searchTerm, mode: "insensitive" } },
      { content: { contains: filters.searchTerm, mode: "insensitive" } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.notice.findMany({
      where: whereConditions,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        audiences: true,
        _count: {
          select: { reads: true },
        },
      },
    }),
    prisma.notice.count({ where: whereConditions }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
}

/**
 * Fetches single notice by ID.
 */
export async function getById(id: string, ctx?: any) {
  const notice = await prisma.notice.findFirst({
    where: {
      id,
      deletedAt: null,
      instituteId: ctx?.instituteId && !ctx?.isPlatformAdmin ? ctx.instituteId : undefined,
    },
    include: {
      audiences: true,
      _count: { select: { reads: true } },
    },
  });

  if (!notice) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Notice not found");
  }

  return notice;
}

export const NoticeService = {
  create: createNotice,
  createNotice,
  update: updateNotice,
  updateNotice,
  publishNotice,
  unpublishNotice,
  pinNotice,
  deleteById: deleteNotice,
  deleteNotice,
  resolveAudienceUsers,
  fanOutNoticeNotifications,
  listMyNotices,
  markRead,
  getUnreadCount,
  getNoticeReadStats,
  getAll,
  getById,
};
