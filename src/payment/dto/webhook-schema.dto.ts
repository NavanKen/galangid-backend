import { createZodDto } from 'nestjs-zod';
import { PaymentStatus } from '@prisma/client';
import { z } from 'zod';

const WebhookSchema = z.object({
  externalId: z.string(),

  status: z.nativeEnum(PaymentStatus),

  failedReason: z.string().optional(),

  rawResponse: z.record(z.string(), z.unknown()).optional(),
});

const MidtranstWebHookSchema = z.object({
  transaction_id: z.string(),
  order_id: z.string(),
  transaction_status: z.string(),
  payment_type: z.string().optional(),
  gross_amount: z.string(),
});

const XenditWebHookSchema = z.object({
  transaction_id: z.string(),
  order_id: z.string(),
  transaction_status: z.string(),
  payment_type: z.string().optional(),
  gross_amount: z.string(),
});

export class PaymentWebhookDto extends createZodDto(WebhookSchema) {}

export class MidtranstWebHookDto extends createZodDto(MidtranstWebHookSchema) {}

export class XenditWebHookDto extends createZodDto(XenditWebHookSchema) {}
