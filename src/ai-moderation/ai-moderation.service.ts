import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AiModerationResponse,
  AiModerationResponseSchema,
} from './dto/ai-moderation.dto';
import { AiModerationStatus } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

const RISK_THRESHOLD = {
  AUTO_APPROVE: 40,
  PENDING_MAX: 70,
};

@Injectable()
export class AiModerationService {
  private readonly logger = new Logger(AiModerationService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.getOrThrow<string>('AI_SERVICE_API');
  }

  async analyzeCampaign(payload: {
    title: string;
    description: string;
    goal_amount?: number;
    category?: string;
  }): Promise<AiModerationResponse> {
    const url = `${this.aiServiceUrl}/moderations/analyze`;

    this.logger.log(
      `Memanggil AI Moderation Service: ${url} untuk campaign "${payload.title}"`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, {
          title: payload.title,
          description: payload.description,
          goal_amount: payload.goal_amount ?? null,
          category: payload.category ?? null,
        }),
      );

      const parsed = AiModerationResponseSchema.parse(response.data);

      this.logger.log(
        `AI Moderation selesai — risk_score: ${parsed.risk_score}, approved: ${parsed.approved}`,
      );

      return parsed;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Gagal memanggil AI Moderation Service: ${errorMessage}`,
        errorStack,
      );

      throw new InternalServerErrorException(
        'Gagal menghubungi AI Moderation Service. Silakan coba lagi.',
      );
    }
  }

  determineDecision(riskScore: number): AiModerationStatus {
    if (riskScore <= RISK_THRESHOLD.AUTO_APPROVE) {
      return AiModerationStatus.AUTO_APPROVED;
    }
    if (riskScore <= RISK_THRESHOLD.PENDING_MAX) {
      return AiModerationStatus.PENDING_REVIEW;
    }
    return AiModerationStatus.REJECTED;
  }

  async saveAnalysis(
    campaignId: string,
    aiResponse: AiModerationResponse,
    decision: AiModerationStatus,
  ) {
    const existingAnalysis = await this.prisma.aiModeration.findUnique({
      where: { campaignId },
    });

    const isReanalyze = !!existingAnalysis;

    if (isReanalyze) {
      this.logger.warn(
        `Re-analisis campaign "${campaignId}" — data sebelumnya akan di-update (risk_score lama: ${existingAnalysis.riskScore}, baru: ${aiResponse.risk_score})`,
      );
    }

    const moderationData = {
      riskScore: aiResponse.risk_score,
      aiApproved: aiResponse.approved,
      category: aiResponse.category,
      summary: aiResponse.summary,
      reason: aiResponse.reason,
      scamIndicators: aiResponse.scam_indicators,
      suggestions: aiResponse.suggestions,
      decision,
    };

    const savedAnalysis = await this.prisma.aiModeration.upsert({
      where: { campaignId },
      create: {
        campaignId,
        ...moderationData,
      },
      update: {
        ...moderationData,
        analyzedAt: new Date(),
      },
    });

    this.logger.log(
      `Hasil AI Moderation ${isReanalyze ? 'di-update' : 'disimpan'} — campaign: ${campaignId}, risk_score: ${savedAnalysis.riskScore}, decision: ${savedAnalysis.decision}`,
    );

    return savedAnalysis;
  }

  async getAnalysis(campaignId: string) {
    const analysis = await this.prisma.aiModeration.findUnique({
      where: { campaignId },
    });

    if (!analysis) {
      throw new NotFoundException(
        `Hasil analisis AI untuk campaign "${campaignId}" tidak ditemukan`,
      );
    }

    this.logger.log(
      `Mengambil hasil analisis AI — campaign: ${campaignId}, risk_score: ${analysis.riskScore}, decision: ${analysis.decision}`,
    );

    return analysis;
  }
}
