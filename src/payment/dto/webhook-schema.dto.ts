import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const WebhookSchema = z.record(z.string(), z.unknown());

export class PaymentWebhookDto extends createZodDto(WebhookSchema) {}
