import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiModerationService } from './ai-moderation.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000,
    }),
    PrismaModule,
  ],
  providers: [AiModerationService],
  exports: [AiModerationService],
})
export class AiModerationModule {}
