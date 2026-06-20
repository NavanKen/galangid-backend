import { PaymentStatus } from '@prisma/client';

export interface CreateGatewayPaymentDto {
  orderId: string;
  amount: number;
}

export interface CreateGatewayPaymentResponse {
  externalId: string;
  paymentUrl?: string;
  paymentDetail?: unknown;
}

export interface GatewayWebhookResult {
  externalId: string;
  status: PaymentStatus;
  failedReason?: string;
  rawResponse: unknown;
}

export interface PaymentGateway {
  createPayment(
    payload: CreateGatewayPaymentDto,
  ): Promise<CreateGatewayPaymentResponse>;

  parseWebhook(payload: unknown): GatewayWebhookResult;
}
