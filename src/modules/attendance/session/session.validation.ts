import { z } from "zod";

const createZodSchema = z.object({
  body: z.record(z.string(), z.any()),
});

const updateZodSchema = z.object({
  body: z.record(z.string(), z.any()),
});

export const SessionValidation = {
  createZodSchema,
  updateZodSchema,
};
