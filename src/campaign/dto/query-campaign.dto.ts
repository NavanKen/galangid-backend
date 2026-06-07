import { createZodDto } from 'nestjs-zod';
import { CampaignCategory, CampaignStatus } from '@prisma/client';
import { querySchema } from 'src/common/dto/query.dto';
import { z } from 'zod';

const queryCampaignSchema = querySchema.extend({
  category: z.enum(CampaignCategory).optional(),
  featured: z.coerce.boolean().optional(),
});

const queryCampaignReviewSchema = querySchema.extend({
  status: z.enum(CampaignStatus).optional(),
});

export class QueryCampaignDto extends createZodDto(queryCampaignSchema) {}

export class QueryCampaignReviewDto extends createZodDto(
  queryCampaignReviewSchema,
) {}
