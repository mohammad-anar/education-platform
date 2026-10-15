-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('HIDDEN', 'ENROLLED_STUDENTS', 'MEMBERS', 'PUBLIC');

-- CreateTable
CREATE TABLE "institute_public_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "instituteId" UUID NOT NULL,
    "about" TEXT,
    "mission" TEXT,
    "gallery" JSONB,
    "facilities" JSONB,
    "socialLinks" JSONB,
    "workingHours" JSONB,
    "mapLocation" JSONB,
    "contactVisibility" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institute_public_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "institute_public_profiles_instituteId_key" ON "institute_public_profiles"("instituteId");

-- AddForeignKey
ALTER TABLE "institute_public_profiles" ADD CONSTRAINT "institute_public_profiles_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "institutes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
