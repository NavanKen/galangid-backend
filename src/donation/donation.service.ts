import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDonationDto } from './dto/create-donation.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CampaignStatus, Prisma } from '@prisma/client';
import {
  AdminQueryDonationDto,
  QueryDonationDto,
} from './dto/query-donation.dto';
import { buildPagination } from 'src/common/utils/pagination';

@Injectable()
export class DonationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDonationDto: CreateDonationDto, userId: string) {
    const campaign = await this.getCampaign(createDonationDto.campaignId);

    this.validateCampaign(campaign);

    const amount = createDonationDto.amount;

    const { platformFee, netAmount } = this.calculateDonation(amount);

    const donation = await this.prisma.donation.create({
      data: {
        campaignId: createDonationDto.campaignId,
        userId,
        amount,
        platformFee,
        netAmount,
        message: createDonationDto.message,
        isAnonymous: createDonationDto.isAnonymous,
      },
    });

    return {
      message: 'Donasi Berhasil Dibuat',
      donation,
    };
  }

  async getMyDonation(donationId: string, userId: string) {
    const donation = await this.prisma.donation.findFirst({
      where: {
        id: donationId,
        userId,
      },
    });

    if (!donation) {
      throw new NotFoundException('Donasi tidak ditemukan');
    }

    return donation;
  }

  async getAllMyDonation(userId: string, query: QueryDonationDto) {
    const { page, limit } = query;

    const skip = (page - 1) * limit;
    const where = this.buildDonationWhere(query);

    where.userId = userId;

    const [donation, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        include: {
          campaign: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImageUrl: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.donation.count({ where }),
    ]);

    return {
      donation,
      pagination: buildPagination(page, limit, total),
    };
  }

  async adminDonationList(query: AdminQueryDonationDto) {
    const { page, limit } = query;

    const skip = (page - 1) * limit;

    const where = this.buildDonationWhere(query);

    if (query.userId) {
      where.userId = query.userId;
    }

    const [donations, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,

        include: {
          user: {
            select: {
              id: true,
              email: true,
            },
          },

          campaign: {
            select: {
              id: true,
              title: true,
            },
          },
        },

        skip,
        take: limit,

        orderBy: {
          createdAt: 'desc',
        },
      }),

      this.prisma.donation.count({
        where,
      }),
    ]);

    return {
      donations,
      pagination: buildPagination(page, limit, total),
    };
  }

  private async getCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign tidak ditemukan');
    }

    return campaign;
  }

  private validateCampaign(campaign: {
    status: CampaignStatus;
    completedAt: Date | null;
    deadlineAt: Date | null;
  }) {
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new BadRequestException('Campaign belum aktif');
    }

    if (campaign.completedAt) {
      throw new BadRequestException('Campaign telah selesai');
    }

    if (campaign.deadlineAt && campaign.deadlineAt < new Date()) {
      throw new BadRequestException('Campaign telah berakhir');
    }
  }

  private calculateDonation(amount: number) {
    const platformFee = amount * 0.05;

    const netAmount = amount - platformFee;

    return {
      platformFee,
      netAmount,
    };
  }

  private buildDonationWhere(query: QueryDonationDto | AdminQueryDonationDto) {
    const where: Prisma.DonationWhereInput = {};

    if (query.search) {
      where.OR = [
        {
          message: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          campaign: {
            title: {
              contains: query.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.campaignId) {
      where.campaignId = query.campaignId;
    }

    return where;
  }
}
