import { GatewayWebhookResult } from 'src/payment/types/gateway-webhook-result';
import {
  CreateGatewayPaymentDto,
  CreateGatewayPaymentResponse,
  PaymentGateway,
} from '../payment-gateway.interface';
import { PaymentStatus } from '@prisma/client';

export class XenditGateway implements PaymentGateway {
  private mapStatus(status: string): PaymentStatus {
    switch (status) {
      case 'SUCCEEDED':
        return PaymentStatus.PAID;

      case 'FAILED':
        return PaymentStatus.FAILED;

      case 'EXPIRED':
        return PaymentStatus.EXPIRED;

      default:
        return PaymentStatus.PENDING;
    }
  }
  parseWebhook(payload: unknown): GatewayWebhookResult {
    const data = payload as {
      id: string;
      status: string;
    };

    return {
      externalId: data.id,
      status: this.mapStatus(data.status),
      rawResponse: payload,
    };
  }

  async createPayment(
    payload: CreateGatewayPaymentDto,
  ): Promise<CreateGatewayPaymentResponse> {
    const { amount, orderId } = payload;

    console.log(amount, orderId);

    const result = await fetch('https://api.xendit...', {
      method: 'POST',
    });

    console.log(result);

    return {
      externalId: crypto.randomUUID(),
      paymentUrl: 'https://xendit-sandbox.com/pay',
    };
  }
}
