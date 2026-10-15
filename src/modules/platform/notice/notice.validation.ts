import { z } from "zod";
import { NoticeAudienceType, NoticeCategory, RecordStatus } from "@prisma/client";

const createZodSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(255),
    content: z.string().min(5),
    category: z.nativeEnum(NoticeCategory).optional(),
    priority: z.number().int().optional(),
    publishAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
    expiresAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
    pinned: z.boolean().optional(),
    attachments: z.any().optional(),
    publishNow: z.boolean().optional(),
    audiences: z
      .array(
        z.object({
          type: z.nativeEnum(NoticeAudienceType),
          targetId: z.string().optional().nullable(),
        })
      )
      .optional(),
  }),
});

const updateZodSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(255).optional(),
    content: z.string().min(5).optional(),
    category: z.nativeEnum(NoticeCategory).optional(),
    priority: z.number().int().optional(),
    publishAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
    expiresAt: z.string().datetime({ offset: true }).or(z.string().datetime()).optional(),
    pinned: z.boolean().optional(),
    attachments: z.any().optional(),
    audiences: z
      .array(
        z.object({
          type: z.nativeEnum(NoticeAudienceType),
          targetId: z.string().optional().nullable(),
        })
      )
      .optional(),
  }),
});

const pinZodSchema = z.object({
  body: z.object({
    pinned: z.boolean(),
  }),
});

const myNoticesQueryZodSchema = z.object({
  query: z.object({
    unreadOnly: z.enum(["true", "false"]).optional(),
    category: z.nativeEnum(NoticeCategory).optional(),
    search: z.string().optional(),
    cursor: z.string().uuid().optional(),
    limit: z.string().optional(),
  }),
});

const noticeFilterQueryZodSchema = z.object({
  query: z.object({
    searchTerm: z.string().optional(),
    status: z.nativeEnum(RecordStatus).optional(),
    category: z.nativeEnum(NoticeCategory).optional(),
    pinned: z.enum(["true", "false"]).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

export const NoticeValidation = {
  createZodSchema,
  updateZodSchema,
  pinZodSchema,
  myNoticesQueryZodSchema,
  noticeFilterQueryZodSchema,
};
