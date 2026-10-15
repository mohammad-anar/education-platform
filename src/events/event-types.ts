export enum DomainEventType {
  LOGIN = "login",
  LESSON_VIEWED = "lesson_viewed",
  VIDEO_HEARTBEAT = "video_heartbeat",
  QUIZ_SUBMITTED = "quiz_submitted",
  ASSIGNMENT_SUBMITTED = "assignment_submitted",
  ATTENDANCE_MARKED = "attendance_marked",
  ENROLLMENT_BANNED = "enrollment_banned",
  RESULT_PUBLISHED = "result_published",
  TICKET_CREATED = "ticket_created",
  NOTICE_PUBLISHED = "notice_published",
}

export interface IDomainEventPayload<T = any> {
  instituteId?: string | null;
  actorId?: string | null;
  eventType: DomainEventType | string;
  entityType?: string | null;
  entityId?: string | null;
  properties?: T;
  occurredAt?: Date;
}

export interface IVideoHeartbeatPayload {
  lessonId: string;
  courseId?: string;
  currentPlaybackSeconds: number;
  totalDurationSeconds?: number;
  playbackRate?: number;
  completed?: boolean;
}
