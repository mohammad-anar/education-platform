-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SUPPORT';

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'WAITING_FOR_STUDENT', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SupportSessionStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateTable: institute_support_settings
CREATE TABLE "institute_support_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT true,
    "openHours" JSONB,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "allowLiveSession" BOOLEAN NOT NULL DEFAULT true,
    "defaultProvider" TEXT NOT NULL DEFAULT 'GOOGLE_MEET',
    "allowedMeetingDomains" TEXT[] DEFAULT ARRAY['zoom.us', 'meet.google.com']::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institute_support_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: support_categories
CREATE TABLE "support_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable: support_tickets
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "studentId" UUID NOT NULL,
    "categoryId" UUID,
    "assignedToUserId" UUID,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "ratingFeedback" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable: support_ticket_messages
CREATE TABLE "support_ticket_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "isInternalNote" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable: support_availability_slots
CREATE TABLE "support_availability_slots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "isBooked" BOOLEAN NOT NULL DEFAULT false,
    "status" "SlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_availability_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: support_sessions
CREATE TABLE "support_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "ticketId" UUID NOT NULL,
    "slotId" UUID,
    "hostUserId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "scheduledStart" TIMESTAMP(3) NOT NULL,
    "scheduledEnd" TIMESTAMP(3) NOT NULL,
    "meetingUrl" TEXT,
    "meetingProvider" TEXT,
    "status" "SupportSessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "cancelledReason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institute_support_settings_instituteId_key" ON "institute_support_settings"("instituteId");
CREATE INDEX "institute_support_settings_instituteId_idx" ON "institute_support_settings"("instituteId");

CREATE UNIQUE INDEX "support_categories_instituteId_code_key" ON "support_categories"("instituteId", "code");
CREATE INDEX "support_categories_instituteId_idx" ON "support_categories"("instituteId");

CREATE UNIQUE INDEX "support_tickets_instituteId_ticketNumber_key" ON "support_tickets"("instituteId", "ticketNumber");
CREATE INDEX "support_tickets_instituteId_status_createdAt_idx" ON "support_tickets"("instituteId", "status", "createdAt");
CREATE INDEX "support_tickets_studentId_createdAt_idx" ON "support_tickets"("studentId", "createdAt");
CREATE INDEX "support_tickets_assignedToUserId_status_idx" ON "support_tickets"("assignedToUserId", "status");
CREATE INDEX "support_tickets_instituteId_idx" ON "support_tickets"("instituteId");

CREATE INDEX "support_ticket_messages_ticketId_createdAt_idx" ON "support_ticket_messages"("ticketId", "createdAt");
CREATE INDEX "support_ticket_messages_instituteId_idx" ON "support_ticket_messages"("instituteId");

CREATE INDEX "support_availability_slots_instituteId_isBooked_startTime_idx" ON "support_availability_slots"("instituteId", "isBooked", "startTime");
CREATE INDEX "support_availability_slots_instituteId_userId_startTime_idx" ON "support_availability_slots"("instituteId", "userId", "startTime");

CREATE UNIQUE INDEX "support_sessions_slotId_key" ON "support_sessions"("slotId");
CREATE INDEX "support_sessions_instituteId_status_scheduledStart_idx" ON "support_sessions"("instituteId", "status", "scheduledStart");
CREATE INDEX "support_sessions_ticketId_idx" ON "support_sessions"("ticketId");
CREATE INDEX "support_sessions_hostUserId_status_idx" ON "support_sessions"("hostUserId", "status");
CREATE INDEX "support_sessions_studentId_scheduledStart_idx" ON "support_sessions"("studentId", "scheduledStart");
CREATE INDEX "support_sessions_instituteId_idx" ON "support_sessions"("instituteId");

-- AddForeignKey
ALTER TABLE "institute_support_settings" ADD CONSTRAINT "institute_support_settings_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_categories" ADD CONSTRAINT "support_categories_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "support_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assignedToUserId_fkey" FOREIGN KEY ("assignedToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_availability_slots" ADD CONSTRAINT "support_availability_slots_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_availability_slots" ADD CONSTRAINT "support_availability_slots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "support_availability_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "support_sessions" ADD CONSTRAINT "support_sessions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
