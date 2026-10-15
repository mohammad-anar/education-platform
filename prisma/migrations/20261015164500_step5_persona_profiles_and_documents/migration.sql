-- CreateEnum
CREATE TYPE "StaffType" AS ENUM ('ADMIN', 'ACCOUNTANT', 'LIBRARIAN', 'SUPPORT', 'SECURITY', 'IT_ADMIN', 'ADMISSION_OFFICER', 'MAINTENANCE', 'OTHER');

-- AlterTable
ALTER TABLE "staff_profiles" ADD COLUMN     "acceptsSupportSessions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "address" JSONB,
ADD COLUMN     "defaultMeetingUrl" TEXT,
ADD COLUMN     "emergencyContact" JSONB,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "photoFileAssetId" UUID,
ADD COLUMN     "staffType" "StaffType" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "visibility" JSONB;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "alternatePhone" TEXT,
ADD COLUMN     "birthCertificateNo" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "medicalConditions" TEXT,
ADD COLUMN     "motherName" TEXT,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "notificationPrefs" JSONB,
ADD COLUMN     "permanentAddress" JSONB,
ADD COLUMN     "photoFileAssetId" UUID,
ADD COLUMN     "presentAddress" JSONB,
ADD COLUMN     "previousSchool" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "statusReason" TEXT,
ADD COLUMN     "visibility" JSONB;

-- AlterTable
ALTER TABLE "teacher_profiles" ADD COLUMN     "acceptsSupportSessions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "address" JSONB,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "defaultMeetingUrl" TEXT,
ADD COLUMN     "headline" TEXT,
ADD COLUMN     "language" TEXT,
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "notificationPrefs" JSONB,
ADD COLUMN     "officeHours" JSONB,
ADD COLUMN     "officePhone" TEXT,
ADD COLUMN     "officeRoom" TEXT,
ADD COLUMN     "photoFileAssetId" UUID,
ADD COLUMN     "publicEmail" TEXT,
ADD COLUMN     "socialLinks" JSONB,
ADD COLUMN     "visibility" JSONB;

-- CreateTable
CREATE TABLE "student_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT,
    "fileAssetId" UUID,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_qualifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "teacherProfileId" UUID NOT NULL,
    "degree" TEXT NOT NULL,
    "fieldOfStudy" TEXT,
    "institution" TEXT NOT NULL,
    "passingYear" INTEGER,
    "grade" TEXT,
    "fileAssetId" UUID,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_qualifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "staffProfileId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "documentType" TEXT,
    "fileAssetId" UUID,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "student_documents_instituteId_studentId_idx" ON "student_documents"("instituteId", "studentId");

-- CreateIndex
CREATE INDEX "student_documents_studentId_idx" ON "student_documents"("studentId");

-- CreateIndex
CREATE INDEX "teacher_qualifications_instituteId_teacherProfileId_idx" ON "teacher_qualifications"("instituteId", "teacherProfileId");

-- CreateIndex
CREATE INDEX "teacher_qualifications_teacherProfileId_idx" ON "teacher_qualifications"("teacherProfileId");

-- CreateIndex
CREATE INDEX "staff_documents_instituteId_staffProfileId_idx" ON "staff_documents"("instituteId", "staffProfileId");

-- CreateIndex
CREATE INDEX "staff_documents_staffProfileId_idx" ON "staff_documents"("staffProfileId");

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_photoFileAssetId_fkey" FOREIGN KEY ("photoFileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_photoFileAssetId_fkey" FOREIGN KEY ("photoFileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_qualifications" ADD CONSTRAINT "teacher_qualifications_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_qualifications" ADD CONSTRAINT "teacher_qualifications_teacherProfileId_fkey" FOREIGN KEY ("teacherProfileId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_qualifications" ADD CONSTRAINT "teacher_qualifications_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_qualifications" ADD CONSTRAINT "teacher_qualifications_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_photoFileAssetId_fkey" FOREIGN KEY ("photoFileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "staff_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "file_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_documents" ADD CONSTRAINT "staff_documents_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
