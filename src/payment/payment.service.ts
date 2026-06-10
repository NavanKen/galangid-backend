import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  Campaign,
  Donation,
  DonationStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { PaymentWebhookDto } from './dto/webhook-schema.dto';
import { PaymentGatewayFactory } from './gateways/payment-gateway.factory';
import { Prisma } from '@prisma/client';
import { CreateGatewayPaymentResponse } from './gateways/payment-gateway.interface';

type DonationWithPayment = Donation & {
  payment: Payment | null;
};

type PaymentWithDonation = Payment & {
  donation: Donation & {
    campaign: Campaign;
  };
};

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const donation = await this.getDonation(createPaymentDto.donationId);

    this.validateDonation(donation);

    const gateway = PaymentGatewayFactory.create(createPaymentDto.provider);

    const gatewayResponse = await gateway.createPayment({
      orderId: this.generateOrderId(),
      amount: Number(donation.amount),
    });

    const payment = await this.createPaymentRecord(
      donation,
      createPaymentDto.provider,
      gatewayResponse,
    );

    return {
      message: 'Payment berhasil dibuat',
      payment,
    };
  }

  async findOne(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },

      include: {
        donation: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment tidak ditemukan');
    }

    return payment;
  }

  async webHook(payload: PaymentWebhookDto) {
    const payment = await this.getPaymentByExternalId(payload.externalId);

    if (
      payment.status === PaymentStatus.PAID &&
      payload.status === PaymentStatus.PAID
    ) {
      return {
        message: 'Payment sudah diproses sebelumnya',
      };
    }

    await this.processPaymentStatus(
      payment,
      payload.status,
      payload.failedReason,
      payload.rawResponse as Prisma.InputJsonValue,
    );

    return {
      message: 'Webhook berhasil diproses',
    };
  }
  private async getDonation(donationId: string) {
    const donation = await this.prisma.donation.findUnique({
      where: {
        id: donationId,
      },
      include: {
        payment: true,
      },
    });

    if (!donation) {
      throw new NotFoundException('Donasi tidak ditemukan');
    }

    return donation;
  }

  private validateDonation(donation: {
    status: DonationStatus;
    payment: unknown;
  }) {
    if (donation.status !== DonationStatus.PENDING) {
      throw new BadRequestException('Donasi tidak dapat diproses');
    }

    if (donation.payment) {
      throw new BadRequestException('Payment sudah pernah dibuat');
    }
  }

  private async createPaymentRecord(
    donation: DonationWithPayment,
    provider: PaymentProvider,
    gatewayResponse: CreateGatewayPaymentResponse,
  ) {
    return this.prisma.payment.create({
      data: {
        donationId: donation.id,

        provider,

        amount: donation.amount,

        externalId: gatewayResponse.externalId,

        paymentUrl: gatewayResponse.paymentUrl,

        externalOrderId: this.generateOrderId(),

        status: PaymentStatus.PENDING,
      },
    });
  }

  private async getPaymentByExternalId(externalId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: {
        externalId,
      },

      include: {
        donation: {
          include: {
            campaign: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment tidak ditemukan');
    }

    return payment;
  }

  private mapDonationStatus(paymentStatus: PaymentStatus): DonationStatus {
    switch (paymentStatus) {
      case PaymentStatus.PAID:
        return DonationStatus.PAID;

      case PaymentStatus.FAILED:
        return DonationStatus.FAILED;

      case PaymentStatus.EXPIRED:
        return DonationStatus.EXPIRED;

      default:
        return DonationStatus.PENDING;
    }
  }

  private async processPaymentStatus(
    payment: PaymentWithDonation,
    paymentStatus: PaymentStatus,
    failedReason?: string,
    rawResponse?: Prisma.InputJsonValue,
  ) {
    const donationStatus = this.mapDonationStatus(paymentStatus);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: {
          id: payment.id,
        },

        data: {
          status: paymentStatus,

          paidAt: paymentStatus === PaymentStatus.PAID ? new Date() : null,

          failedReason,

          rawResponse,
        },
      });

      await tx.donation.update({
        where: {
          id: payment.donationId,
        },

        data: {
          status: donationStatus,
        },
      });

      if (paymentStatus === PaymentStatus.PAID) {
        await tx.campaign.update({
          where: {
            id: payment.donation.campaignId,
          },

          data: {
            currentAmount: {
              increment: payment.donation.netAmount,
            },

            donorCount: {
              increment: 1,
            },
          },
        });
      }
    });
  }

  private generateOrderId() {
    return `DON-${Date.now()}`;
  }
}
