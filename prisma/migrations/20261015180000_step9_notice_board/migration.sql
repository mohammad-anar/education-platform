-- CreateEnum
CREATE TYPE "NoticeCategory" AS ENUM ('GENERAL', 'ACADEMIC', 'EXAMINATION', 'EVENT', 'EMERGENCY', 'HOLIDAY', 'FEE', 'ADMINISTRATIVE');

-- AlterTable: notices
ALTER TABLE "notices" ADD COLUMN "category" "NoticeCategory" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN "pinned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "attachments" JSONB,
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateTable: notice_reads
CREATE TABLE "notice_reads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "noticeId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notice_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE INDEX "notices_instituteId_pinned_idx" ON "notices"("instituteId", "pinned");
CREATE INDEX "notices_instituteId_status_publishAt_idx" ON "notices"("instituteId", "status", "publishAt");

CREATE UNIQUE INDEX "notice_reads_noticeId_userId_key" ON "notice_reads"("noticeId", "userId");
CREATE INDEX "notice_reads_userId_readAt_idx" ON "notice_reads"("userId", "readAt");
CREATE INDEX "notice_reads_noticeId_idx" ON "notice_reads"("noticeId");

-- AddForeignKey
ALTER TABLE "notice_reads" ADD CONSTRAINT "notice_reads_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "notices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "notice_reads" ADD CONSTRAINT "notice_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
