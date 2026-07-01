import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AiModerationModule } from 'src/ai-moderation/ai-moderation.module';

@Module({
  imports: [PrismaModule, AiModerationModule],
  controllers: [CampaignController],
  providers: [CampaignService],
})
export class CampaignModule {}
