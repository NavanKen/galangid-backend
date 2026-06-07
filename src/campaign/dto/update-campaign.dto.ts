import { createZodDto } from 'nestjs-zod';
import { CreateCampaignSchema } from './create-campaign.dto';

const updateCampaignSchema = CreateCampaignSchema.partial();

export class UpdateCampaignDto extends createZodDto(updateCampaignSchema) {}
