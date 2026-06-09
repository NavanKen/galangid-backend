import { createZodDto } from 'nestjs-zod';
import { PaymentStatus } from '@prisma/client';
import { z } from 'zod';

const WebhookSchema = z.object({
  externalId: z.string(),

  status: z.nativeEnum(PaymentStatus),

  failedReason: z.string().optional(),

  rawResponse: z.record(z.string(), z.unknown()).optional(),
});

export class PaymentWebhookDto extends createZodDto(WebhookSchema) {}
