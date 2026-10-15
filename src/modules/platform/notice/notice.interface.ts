import { NoticeAudienceType, NoticeCategory, RecordStatus } from "@prisma/client";

export interface INoticeAudienceItem {
  type: NoticeAudienceType;
  targetId?: string | null;
}

export interface ICreateNoticePayload {
  title: string;
  content: string;
  category?: NoticeCategory;
  priority?: number;
  publishAt?: string | Date;
  expiresAt?: string | Date;
  pinned?: boolean;
  attachments?: any;
  publishNow?: boolean;
  audiences?: INoticeAudienceItem[];
}

export interface IUpdateNoticePayload {
  title?: string;
  content?: string;
  category?: NoticeCategory;
  priority?: number;
  publishAt?: string | Date;
  expiresAt?: string | Date;
  pinned?: boolean;
  attachments?: any;
  audiences?: INoticeAudienceItem[];
}

export interface INoticeFilterRequest {
  searchTerm?: string;
  status?: RecordStatus;
  category?: NoticeCategory;
  pinned?: boolean;
  instituteId?: string;
}

export interface IMyNoticeFilterQuery {
  unreadOnly?: boolean;
  category?: NoticeCategory;
  search?: string;
  cursor?: string;
  limit?: number;
}
