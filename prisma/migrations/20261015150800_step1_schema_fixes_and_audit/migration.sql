-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('OWN', 'ASSIGNED', 'INSTITUTE', 'ALL');

-- CreateEnum
CREATE TYPE "OverrideEffect" AS ENUM ('GRANT', 'DENY');

-- AlterTable: Timing fields on assessments and assignments
ALTER TABLE "assessments" ADD COLUMN "closesAt" TIMESTAMP(3),
ADD COLUMN "dueAt" TIMESTAMP(3),
ADD COLUMN "opensAt" TIMESTAMP(3);

ALTER TABLE "assignments" ADD COLUMN "closesAt" TIMESTAMP(3),
ADD COLUMN "opensAt" TIMESTAMP(3);

-- AlterTable: Subscriptions & Payments
ALTER TABLE "subscriptions" ADD COLUMN "canceledReason" TEXT,
ADD COLUMN "cancelledAt" TIMESTAMP(3);

ALTER TABLE "subscription_payments" ADD COLUMN "periodEnd" TIMESTAMP(3),
ADD COLUMN "periodStart" TIMESTAMP(3);

-- AlterTable: Notifications
ALTER TABLE "notifications" ADD COLUMN "instituteId" UUID;

-- AlterTable: Role Permissions
ALTER TABLE "role_permissions" ADD COLUMN "scope" "PermissionScope" NOT NULL DEFAULT 'OWN';

-- CreateTable: UserPermissionOverride
CREATE TABLE "user_permission_overrides" (
    "id" UUID NOT NULL,
    "instituteId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "effect" "OverrideEffect" NOT NULL,
    "scope" "PermissionScope" NOT NULL DEFAULT 'OWN',
    "expiresAt" TIMESTAMP(3),
    "reason" TEXT,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Department
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "instituteId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Designation
CREATE TABLE "designations" (
    "id" UUID NOT NULL,
    "instituteId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designations_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Denormalize instituteId as nullable first for safe backfill
ALTER TABLE "assignment_submissions" ADD COLUMN "instituteId" UUID;
ALTER TABLE "attendance_records" ADD COLUMN "instituteId" UUID;
ALTER TABLE "course_enrollments" ADD COLUMN "instituteId" UUID;
ALTER TABLE "exam_marks" ADD COLUMN "instituteId" UUID;
ALTER TABLE "learning_item_progress" ADD COLUMN "instituteId" UUID;

-- Backfill SQL: Populate denormalized instituteId from parent entities
UPDATE "attendance_records" ar
SET "instituteId" = s."instituteId"
FROM "attendance_sessions" s
WHERE ar."sessionId" = s."id" AND ar."instituteId" IS NULL;

UPDATE "course_enrollments" ce
SET "instituteId" = c."instituteId"
FROM "courses" c
WHERE ce."courseId" = c."id" AND ce."instituteId" IS NULL;

UPDATE "learning_item_progress" lip
SET "instituteId" = ce."instituteId"
FROM "course_enrollments" ce
WHERE lip."enrollmentId" = ce."id" AND lip."instituteId" IS NULL;

UPDATE "exam_marks" em
SET "instituteId" = e."instituteId"
FROM "exams" e
WHERE em."examId" = e."id" AND em."instituteId" IS NULL;

UPDATE "assignment_submissions" asub
SET "instituteId" = a."instituteId"
FROM "assignments" ass
JOIN "assessments" a ON ass."assessmentId" = a."id"
WHERE asub."assignmentId" = ass."id" AND asub."instituteId" IS NULL;

-- Enforce NOT NULL constraint on denormalized columns after backfill
ALTER TABLE "assignment_submissions" ALTER COLUMN "instituteId" SET NOT NULL;
ALTER TABLE "attendance_records" ALTER COLUMN "instituteId" SET NOT NULL;
ALTER TABLE "course_enrollments" ALTER COLUMN "instituteId" SET NOT NULL;
ALTER TABLE "exam_marks" ALTER COLUMN "instituteId" SET NOT NULL;
ALTER TABLE "learning_item_progress" ALTER COLUMN "instituteId" SET NOT NULL;

-- Create Indexes
CREATE INDEX "user_permission_overrides_instituteId_userId_idx" ON "user_permission_overrides"("instituteId", "userId");
CREATE UNIQUE INDEX "user_permission_overrides_instituteId_userId_permissionId_key" ON "user_permission_overrides"("instituteId", "userId", "permissionId");

CREATE INDEX "departments_instituteId_idx" ON "departments"("instituteId");
CREATE UNIQUE INDEX "departments_instituteId_code_key" ON "departments"("instituteId", "code");

CREATE INDEX "designations_instituteId_idx" ON "designations"("instituteId");
CREATE UNIQUE INDEX "designations_instituteId_code_key" ON "designations"("instituteId", "code");

CREATE INDEX "assignment_submissions_instituteId_studentId_idx" ON "assignment_submissions"("instituteId", "studentId");
CREATE INDEX "attendance_records_instituteId_status_idx" ON "attendance_records"("instituteId", "status");
CREATE INDEX "attendance_records_instituteId_studentId_idx" ON "attendance_records"("instituteId", "studentId");
CREATE INDEX "course_enrollments_instituteId_status_idx" ON "course_enrollments"("instituteId", "status");
CREATE INDEX "exam_marks_instituteId_studentId_idx" ON "exam_marks"("instituteId", "studentId");
CREATE INDEX "learning_item_progress_instituteId_status_idx" ON "learning_item_progress"("instituteId", "status");
CREATE INDEX "notifications_instituteId_createdAt_idx" ON "notifications"("instituteId", "createdAt");

-- Foreign Key Constraints
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "exam_marks" ADD CONSTRAINT "exam_marks_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_item_progress" ADD CONSTRAINT "learning_item_progress_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "departments" ADD CONSTRAINT "departments_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "designations" ADD CONSTRAINT "designations_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
