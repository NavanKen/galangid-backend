import {
  CreateGatewayPaymentDto,
  CreateGatewayPaymentResponse,
  PaymentGateway,
} from '../payment-gateway.interface';
import axios from 'axios';

type MidtransAction = {
  name: string;
  url: string;
};

type MidtransChargeResponse = {
  transaction_id: string;
  actions?: MidtransAction[];
};

export class MidtransGateway implements PaymentGateway {
  private getAuthHeader() {
    const auth = Buffer.from(`${process.env.MIDTRANS_SERVER_KEY}:`).toString(
      'base64',
    );

    return `Basic ${auth}`;
  }

  async createPayment(
    payload: CreateGatewayPaymentDto,
  ): Promise<CreateGatewayPaymentResponse> {
    const { data } = await axios.post<MidtransChargeResponse>(
      `${process.env.MIDTRANS_BASE_URL}`,
      {
        payment_type: 'gopay',
        transaction_details: {
          order_id: payload.orderId,
          gross_amount: payload.amount,
        },
      },
      {
        headers: {
          Authorization: this.getAuthHeader(),
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      externalId: data.transaction_id,
      paymentUrl: data.actions?.find(
        (action: { name: string }) => action.name === 'deeplink-redirect',
      )?.url,
      paymentDetail: data.actions,
    };
  }
}
