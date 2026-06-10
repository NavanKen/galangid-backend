export interface CreateGatewayPaymentDto {
  orderId: string;
  amount: number;
}

export interface CreateGatewayPaymentResponse {
  externalId: string;
  paymentUrl?: string;
}

export interface PaymentGateway {
  createPayment(
    payload: CreateGatewayPaymentDto,
  ): Promise<CreateGatewayPaymentResponse>;
}
