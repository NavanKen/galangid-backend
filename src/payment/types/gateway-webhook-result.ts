import { PaymentStatus } from '@prisma/client';

export type GatewayWebhookResult = {
  externalId: string;
  status: PaymentStatus;
  rawResponse: unknown;
  failedReason?: string;
};
