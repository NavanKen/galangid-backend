import {
  CreateGatewayPaymentDto,
  CreateGatewayPaymentResponse,
  PaymentGateway,
} from '../payment-gateway.interface';

export class XenditGateway implements PaymentGateway {
  async createPayment(
    payload: CreateGatewayPaymentDto,
  ): Promise<CreateGatewayPaymentResponse> {
    return {
      externalId: crypto.randomUUID(),
      paymentUrl: 'https://xendit-sandbox.com/pay',
    };
  }
}
