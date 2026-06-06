import { createZodDto } from 'nestjs-zod';
import { CampaignCategory } from '@prisma/client';
import { querySchema } from 'src/common/dto/query.dto';
import { z } from 'zod';

export const queryCampaignSchema = querySchema.extend({
  category: z.enum(CampaignCategory).optional(),
  featured: z.coerce.boolean().optional(),
});

export class QueryCampaignDto extends createZodDto(queryCampaignSchema) {}
