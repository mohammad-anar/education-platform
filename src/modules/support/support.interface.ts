import { TicketPriority, TicketStatus, SlotStatus, SupportSessionStatus } from "@prisma/client";

export interface IOpenHoursDay {
  isOpen?: boolean;
  start?: string; // HH:mm e.g. "09:00"
  end?: string;   // HH:mm e.g. "17:00"
}

export type IOpenHours = Record<string, IOpenHoursDay>;

export interface ISupportSettingUpdatePayload {
  isOpen?: boolean;
  openHours?: IOpenHours;
  timezone?: string;
  allowLiveSession?: boolean;
  defaultProvider?: string;
  allowedMeetingDomains?: string[];
}

export interface ICreateTicketPayload {
  subject: string;
  description: string;
  categoryId?: string;
  priority?: TicketPriority;
  message?: string;
  metadata?: any;
}

export interface IAddMessagePayload {
  message: string;
  attachments?: any;
}

export interface IRateTicketPayload {
  rating: number; // 1 to 5
  ratingFeedback?: string;
}

export interface IAssignTicketPayload {
  assignedToUserId: string;
}

export interface IChangeTicketStatusPayload {
  status: TicketStatus;
}

export interface IAddInternalNotePayload {
  note: string;
  attachments?: any;
}

export interface IAvailabilitySlotItem {
  startTime: string | Date;
  endTime: string | Date;
}

export interface IPublishAvailabilityPayload {
  slots: IAvailabilitySlotItem[];
}

export interface IBookSlotPayload {
  slotId: string;
  ticketId: string;
}

export interface IConfirmSessionPayload {
  meetingUrl?: string;
  meetingProvider?: string;
}

export interface ICompleteSessionPayload {
  notes?: string;
}

export interface IRequestLiveSessionPayload {
  notes?: string;
  slotId?: string;
}

export interface ITicketFilterQuery {
  status?: TicketStatus;
  priority?: TicketPriority;
  categoryId?: string;
  assignedToUserId?: string;
  studentId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
