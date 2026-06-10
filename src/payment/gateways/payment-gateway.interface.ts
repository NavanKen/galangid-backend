export interface CreateGatewayPaymentResponse {
  externalId: string;
  paymentUrl: string;
  expiresAt?: Date;
}

export interface PaymentGateway {
  createPayment(amount: number): Promise<CreateGatewayPaymentResponse>;
}
