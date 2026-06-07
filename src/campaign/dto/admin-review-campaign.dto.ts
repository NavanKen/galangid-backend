import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const RejectedCampaignSchema = z.object({
  note: z.string().min(10),
});

export class RejectedCampaignDto extends createZodDto(RejectedCampaignSchema) {}
