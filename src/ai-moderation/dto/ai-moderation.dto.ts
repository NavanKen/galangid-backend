import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AiModerationRequestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  goal_amount: z.number().positive().optional(),
  category: z.string().optional(),
});

export class AiModerationRequestDto extends createZodDto(
  AiModerationRequestSchema,
) {}

export const AiModerationResponseSchema = z.object({
  approved: z.boolean(),
  risk_score: z.number().min(0).max(100),
  category: z.string(),
  summary: z.string(),
  reason: z.string(),
  scam_indicators: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});

export type AiModerationResponse = z.infer<typeof AiModerationResponseSchema>;
