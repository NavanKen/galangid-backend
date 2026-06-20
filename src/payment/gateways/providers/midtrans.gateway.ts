import {
  CreateGatewayPaymentDto,
  CreateGatewayPaymentResponse,
  PaymentGateway,
} from '../payment-gateway.interface';
import axios from 'axios';
import { PaymentStatus } from '@prisma/client';
import { GatewayWebhookResult } from '../payment-gateway.interface';

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

  private mapStatus(status: string): PaymentStatus {
    switch (status) {
      case 'settlement':
      case 'capture':
        return PaymentStatus.PAID;

      case 'expire':
        return PaymentStatus.EXPIRED;

      case 'deny':
      case 'cancel':
      case 'failure':
        return PaymentStatus.FAILED;

      default:
        return PaymentStatus.PENDING;
    }
  }

  parseWebhook(payload: unknown): GatewayWebhookResult {
    const data = payload as {
      transaction_id: string;
      transaction_status: string;
    };

    return {
      externalId: data.transaction_id,
      status: this.mapStatus(data.transaction_status),
      rawResponse: payload,
    };
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
