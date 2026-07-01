import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { UpdateCampaignDto } from './dto/update-campaign.dto';
import {
  QueryCampaignDto,
  QueryCampaignReviewDto,
} from './dto/query-campaign.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { buildPagination } from '../common/utils/pagination';
import { Campaign } from '@prisma/client';
import { CampaignStatus, AiModerationStatus } from '@prisma/client';
import { RejectedCampaignDto } from './dto/admin-review-campaign.dto';
import { AiModerationService } from 'src/ai-moderation/ai-moderation.service';
import slugify from 'slugify';

@Injectable()
export class CampaignService {
  private readonly logger = new Logger(CampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiModerationService: AiModerationService,
  ) {}

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

  findAll(query: QueryCampaignDto) {
    const { page, limit } = query;

    const where = this.buildCampaignWhere(query, {
      status: CampaignStatus.ACTIVE,
    });

    return this.paginateCampaign(where, page, limit);
  }

  myCampaign(query: QueryCampaignDto, userId: string) {
    const { page, limit } = query;

    const where = this.buildCampaignWhere(query, { userId });

    return this.paginateCampaign(where, page, limit);
  }

  findAllAdmin(query: QueryCampaignDto) {
    const { page, limit } = query;

    const where = this.buildCampaignWhere(query);

    return this.paginateCampaign(where, page, limit, {
      includeAiModeration: true,
    });
  }

  async findAllCampaignReviewHistory(query: QueryCampaignReviewDto) {
    const { page, limit, search, status } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.CampaignReviewWhereInput = {};

    if (search) {
      where.OR = [
        {
          campaign: {
            title: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [campaignReviews, total] = await Promise.all([
      this.prisma.campaignReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { reviewedAt: 'desc' },
      }),
      this.prisma.campaignReview.count({ where }),
    ]);

    return {
      message: 'Berhasil mengambil data',
      campaignReviews,
      pagination: buildPagination(page, limit, total),
    };
  }

  async findOne(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        aiModeration: true,
      },
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
    const campaign = await this.getCampaign(id);

    this.validateCampaignOwner(campaign, userId);

    const updateCampaign = await this.prisma.campaign.update({
      where: { id },
      data: updateCampaignDto,
    });

    return {
      message: 'Campaign berhasil di upadate',
      updateCampaign,
    };
  }

  async remove(id: string, userId: string) {
    const campaign = await this.getCampaign(id);

    this.validateCampaignOwner(campaign, userId);

    const deleteCampaign = await this.prisma.campaign.delete({
      where: { id },
    });

    return {
      message: 'Campaign berhasil dihapus',
      deleteCampaign,
    };
  }

  async submit(id: string, userId: string) {
    const campaign = await this.getCampaign(id);

    this.validateCampaignOwner(campaign, userId);

    this.validateCampaignBeforeSubmit(campaign);

    const aiResponse = await this.aiModerationService.analyzeCampaign({
      title: campaign.title,
      description: campaign.description,
      goal_amount: campaign.targetAmount
        ? Number(campaign.targetAmount)
        : undefined,
      category: campaign.category ?? undefined,
    });

    const decision = this.aiModerationService.determineDecision(
      aiResponse.risk_score,
    );

    const campaignStatusMap: Record<AiModerationStatus, CampaignStatus> = {
      [AiModerationStatus.AUTO_APPROVED]: CampaignStatus.ACTIVE,
      [AiModerationStatus.PENDING_REVIEW]: CampaignStatus.PENDING_REVIEW,
      [AiModerationStatus.REJECTED]: CampaignStatus.PENDING_REVIEW,
    };

    const newStatus = campaignStatusMap[decision];

    this.logger.log(
      `Campaign "${campaign.title}" — AI risk_score: ${aiResponse.risk_score}, decision: ${decision}, status: ${newStatus}`,
    );

    const [updatedCampaign, aiModeration] = await this.prisma.$transaction([
      this.prisma.campaign.update({
        where: { id },
        data: {
          status: newStatus,
          publishedAt:
            newStatus === CampaignStatus.ACTIVE ? new Date() : undefined,
        },
      }),

      this.prisma.aiModeration.upsert({
        where: { campaignId: id },
        create: {
          campaignId: id,
          riskScore: aiResponse.risk_score,
          aiApproved: aiResponse.approved,
          category: aiResponse.category,
          summary: aiResponse.summary,
          reason: aiResponse.reason,
          scamIndicators: aiResponse.scam_indicators,
          suggestions: aiResponse.suggestions,
          decision,
        },
        update: {
          riskScore: aiResponse.risk_score,
          aiApproved: aiResponse.approved,
          category: aiResponse.category,
          summary: aiResponse.summary,
          reason: aiResponse.reason,
          scamIndicators: aiResponse.scam_indicators,
          suggestions: aiResponse.suggestions,
          decision,
          analyzedAt: new Date(),
        },
      }),
    ]);

    const statusMessages: Record<AiModerationStatus, string> = {
      [AiModerationStatus.AUTO_APPROVED]:
        'Campaign Anda berhasil dipublikasikan!',
      [AiModerationStatus.PENDING_REVIEW]:
        'Campaign Anda sedang dalam proses review oleh admin.',
      [AiModerationStatus.REJECTED]:
        'Campaign Anda memerlukan review manual oleh admin sebelum dapat dipublikasikan.',
    };

    return {
      message: statusMessages[decision],
      campaign: updatedCampaign,
      aiReview: {
        riskScore: aiModeration.riskScore,
        category: aiModeration.category,
        summary: aiModeration.summary,
        suggestions: aiModeration.suggestions,
        decision: aiModeration.decision,
      },
    };
  }

  pendingReviewList(query: QueryCampaignDto) {
    const { page, limit } = query;
    const where = this.buildCampaignWhere(query, {
      status: CampaignStatus.PENDING_REVIEW,
    });

    return this.paginateCampaign(where, page, limit, {
      includeAiModeration: true,
    });
  }

  async reject(id: string, dto: RejectedCampaignDto, adminId: string) {
    const campaign = await this.getCampaign(id);

    const rejectCampaign = await this.prisma.$transaction([
      this.prisma.campaign.update({
        where: {
          id: campaign.id,
        },
        data: {
          status: CampaignStatus.REJECTED,
          adminNote: dto.note,
        },
      }),

      this.prisma.campaignReview.create({
        data: {
          campaignId: campaign.id,
          adminId,
          status: CampaignStatus.REJECTED,
          note: dto.note,
        },
      }),
    ]);

    return {
      message: 'Review Campaign Sudah Dibuat',
      rejectCampaign,
    };
  }

  async suspend(id: string, dto: RejectedCampaignDto, adminId: string) {
    const campaign = await this.getCampaign(id);

    const suspendCampaign = await this.prisma.$transaction([
      this.prisma.campaign.update({
        where: {
          id: campaign.id,
        },
        data: {
          status: CampaignStatus.SUSPENDED,
          adminNote: dto.note,
        },
      }),

      this.prisma.campaignReview.create({
        data: {
          campaignId: campaign.id,
          adminId,
          status: CampaignStatus.SUSPENDED,
          note: dto.note,
        },
      }),
    ]);

    return {
      message: 'Review Campaign Sudah Dibuat',
      suspendCampaign,
    };
  }

  async aprrove(id: string, adminId: string) {
    const campaign = await this.getCampaign(id);

    const approveCampaign = await this.prisma.$transaction([
      this.prisma.campaign.update({
        where: {
          id: campaign.id,
        },
        data: {
          status: CampaignStatus.ACTIVE,
        },
      }),

      this.prisma.campaignReview.create({
        data: {
          campaignId: campaign.id,
          adminId,
          status: CampaignStatus.ACTIVE,
        },
      }),
    ]);

    return {
      message: 'Review Campaign Sudah Dibuat',
      approveCampaign,
    };
  }

  private buildCampaignWhere(
    query: QueryCampaignDto,
    options?: {
      status?: CampaignStatus;
      userId?: string;
    },
  ): Prisma.CampaignWhereInput {
    const where: Prisma.CampaignWhereInput = {};

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (query.search) {
      where.OR = [
        {
          title: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
        {
          shortDesc: {
            contains: query.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.featured !== undefined) {
      where.isFeatured = query.featured;
    }

    if (options?.status) {
      where.status = options.status;
    }

    return where;
  }

  private async paginateCampaign(
    where: Prisma.CampaignWhereInput,
    page: number,
    limit: number,
    options?: { includeAiModeration?: boolean },
  ) {
    const skip = (page - 1) * limit;

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: options?.includeAiModeration
          ? { aiModeration: true }
          : undefined,
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

  private validateCampaignOwner(campaign: { userId: string }, userId: string) {
    if (campaign.userId !== userId) {
      throw new ForbiddenException('Bukan pemilik campaign');
    }
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

  private validateCampaignBeforeSubmit(campaign: Campaign) {
    if (campaign.status !== CampaignStatus.DRAFT) {
      throw new BadRequestException('Hanya campaign draft yang dapat disubmit');
    }

    if (!campaign.deadlineAt) {
      throw new BadRequestException('Tanggal berakhir campaign wajib diisi');
    }
  }
}
