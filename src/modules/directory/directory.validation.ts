import { z } from "zod";

const visibilityLevelEnum = z.enum(["HIDDEN", "ENROLLED_STUDENTS", "MEMBERS", "PUBLIC"]);

const updateTeacherVisibilityZodSchema = z
  .object({
    visibility: z
      .object({
        phone: visibilityLevelEnum.optional(),
        officePhone: visibilityLevelEnum.optional(),
        email: visibilityLevelEnum.optional(),
        publicEmail: visibilityLevelEnum.optional(),
        officeHours: visibilityLevelEnum.optional(),
        officeRoom: visibilityLevelEnum.optional(),
        defaultMeetingUrl: visibilityLevelEnum.optional(),
        socialLinks: visibilityLevelEnum.optional(),
        address: visibilityLevelEnum.optional(),
        nationalId: visibilityLevelEnum.optional(),
      })
      .catchall(visibilityLevelEnum),
  })
  .strict();

const updateInstituteContactVisibilityZodSchema = z
  .object({
    contactVisibility: z
      .object({
        phone: visibilityLevelEnum.optional(),
        email: visibilityLevelEnum.optional(),
        address: visibilityLevelEnum.optional(),
      })
      .catchall(visibilityLevelEnum),
  })
  .strict();

export const DirectoryValidation = {
  updateTeacherVisibilityZodSchema,
  updateInstituteContactVisibilityZodSchema,
};

export default DirectoryValidation;
