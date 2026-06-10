import {
  CreateGatewayPaymentResponse,
  PaymentGateway,
} from '../payment-gateway.interface';

export class MidtransGateway implements PaymentGateway {
  async createPayment(amount: number): Promise<CreateGatewayPaymentResponse> {
    return {
      externalId: crypto.randomUUID(),
      paymentUrl: 'https://midtrans-sandbox.com/pay',
    };
  }
}
