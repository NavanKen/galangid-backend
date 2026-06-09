import { createZodDto } from 'nestjs-zod';
import { PaymentStatus } from '@prisma/client';
import { z } from 'zod';

const WebhookSchema = z.object({
  externalId: z.string(),

  status: z.nativeEnum(PaymentStatus),
});

export class PaymentWebhookDto extends createZodDto(WebhookSchema) {}
