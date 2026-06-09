import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  Donation,
  DonationStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { PaymentWebhookDto } from './dto/webhook-schema.dto';

type DonationWithPayment = Donation & {
  payment: Payment | null;
};

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const donation = await this.getDonation(createPaymentDto.donationId);

    this.validateDonation(donation);

    const payment = await this.createPaymentRecord(
      donation,
      createPaymentDto.provider,
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
    const payment = await this.prisma.payment.findUnique({
      where: {
        externalId: payload.externalId,
      },

      include: {
        donation: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment tidak ditemukan');
    }

    await this.prisma.payment.update({
      where: {
        id: payment.id,
      },

      data: {
        status: payload.status,
        paidAt: payload.status === PaymentStatus.PAID ? new Date() : null,
      },
    });

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
  ) {
    return this.prisma.payment.create({
      data: {
        donationId: donation.id,

        provider,

        amount: donation.amount,

        externalId: randomUUID(),

        externalOrderId: this.generateOrderId(),

        status: PaymentStatus.PENDING,
      },
    });
  }

  private generateOrderId() {
    return `DON-${Date.now()}`;
  }
}
