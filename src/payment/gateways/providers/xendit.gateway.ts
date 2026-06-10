import {
  PaymentGateway,
  CreateGatewayPaymentResponse,
} from '../payment-gateway.interface';

export class XenditGateway implements PaymentGateway {
  async createPayment(amount: number): Promise<CreateGatewayPaymentResponse> {
    return {
      externalId: crypto.randomUUID(),
      paymentUrl: 'https://xendit-sandbox.com/pay',
    };
  }
}
