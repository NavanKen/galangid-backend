import { PaymentProvider } from '@prisma/client';
import { MidtransGateway } from './providers/midtrans.gateway';
import { XenditGateway } from './providers/xendit.gateway';

export class PaymentGatewayFactory {
  static create(provider: PaymentProvider) {
    switch (provider) {
      case PaymentProvider.MIDTRANS:
        return new MidtransGateway();

      case PaymentProvider.XENDIT:
        return new XenditGateway();

      default:
        throw new Error('Provider Tidak didukung');
    }
  }
}
