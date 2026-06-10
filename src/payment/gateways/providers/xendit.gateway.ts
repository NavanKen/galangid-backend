import { GatewayWebhookResult } from 'src/payment/types/gateway-webhook-result';
import {
  CreateGatewayPaymentDto,
  CreateGatewayPaymentResponse,
  PaymentGateway,
} from '../payment-gateway.interface';
import { XenditWebHookDto } from 'src/payment/dto/webhook-schema.dto';

export class XenditGateway implements PaymentGateway {
  parseWebhook(payload: XenditWebHookDto): GatewayWebhookResult {
    return {
      externalId: payload.transaction_id,

      status: 'EXPIRED',

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
