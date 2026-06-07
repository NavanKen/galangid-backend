import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import { QueryCampaignDto } from './dto/query-campaign.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { buildPagination } from 'src/common/utils/pagination';
import slugify from 'slugify';

@Injectable()
export class CampaignService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createCampaignDto: CreateCampaignDto, userId: string) {
    const slug = slugify(createCampaignDto.title, {
      lower: true,
      strict: true,
    });

    const createCampaign = await this.prisma.campaign.create({
      data: {
        userId,
        slug,
        title: createCampaignDto.title,
        shortDesc: createCampaignDto.shortDesc,
        description: createCampaignDto.description,
        coverImageUrl: createCampaignDto.coverImageUrl,
        category: createCampaignDto.category,
        targetAmount: createCampaignDto.targetAmount,
        deadlineAt: createCampaignDto.deadlineAt,
        isUrgent: createCampaignDto.isUrgent,
        status: 'DRAFT',
      },
    });

    return {
      message: 'Berhasil Membuat Campaign',
      createCampaign,
    };
  }

  async findAll(query: QueryCampaignDto) {
    const { page = 1, limit = 10, search, category, featured } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CampaignWhereInput = {};

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          shortDesc: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (featured) {
      where.isFeatured = featured;
    }

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.campaign.count({
        where,
      }),
    ]);

    return {
      campaigns,
      pagination: buildPagination(page, limit, total),
    };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign tidak ditemukan');
    }

    return campaign;
  }

  async update(
    id: string,
    updateCampaignDto: UpdateCampaignDto,
    userId: string,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign tidak ditemukan');
    }

    if (campaign.userId !== userId) {
      throw new ForbiddenException('Bukan pemilik Campaign');
    }

    const updateCampaign = await this.prisma.campaign.update({
      where: { id },
      data: updateCampaignDto,
    });

    return {
      message: 'Campaign berhasil di upadate',
      updateCampaign,
    };
  }

  async remove(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign tidak ditemukan');
    }

    const deleteCampaign = await this.prisma.campaign.delete({
      where: { id },
    });

    return {
      message: 'Campaign berhasil dihapus',
      deleteCampaign,
    };
  }
}
