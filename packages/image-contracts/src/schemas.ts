import { z } from "zod";

export const ModerationStatusSchema = z.enum([
  "pending",
  "safe",
  "needs_blur",
  "blocked",
  "review",
]);

export const ResizeActionSchema = z.object({
  kind: z.literal("resize"),
  width: z.number().int().positive(),
});

export const ThumbActionSchema = z.object({
  kind: z.literal("thumb"),
  width: z.number().int().positive(),
});

export const BlurActionSchema = z.object({
  kind: z.literal("blur"),
  radius: z.number().int().nonnegative(),
});

export const ConvertActionSchema = z.object({
  kind: z.literal("convert"),
  format: z.enum(["webp", "avif"]),
});

export const ImageActionSchema = z.discriminatedUnion("kind", [
  ResizeActionSchema,
  ThumbActionSchema,
  BlurActionSchema,
  ConvertActionSchema,
]);

export const PolicyResultSchema = z.object({
  moderationStatus: ModerationStatusSchema,
  modelVersion: z.string().min(1),
});

export const ImageProcessingJobSchema = z.object({
  jobId: z.string().uuid(),
  imageId: z.string().min(1),
  originalKey: z.string().min(1),
  actions: z.array(ImageActionSchema),
  policyResult: PolicyResultSchema,
  modelVersion: z.string().min(1),
  createdAt: z.string().datetime(),
});

export type ModerationStatusInput = z.infer<typeof ModerationStatusSchema>;
export type PolicyResultInput = z.infer<typeof PolicyResultSchema>;
export type ImageProcessingJobInput = z.infer<typeof ImageProcessingJobSchema>;
