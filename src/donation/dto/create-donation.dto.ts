import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateDonationSchema = z.object({
  campaignId: z.cuid(),
  amount: z.coerce.number().positive('Nominal donasi harus lebih dari 0'),
  isAnonymous: z.boolean().optional().default(false),
  message: z.string().max(500).optional(),
});

export class CreateDonationDto extends createZodDto(CreateDonationSchema) {}
