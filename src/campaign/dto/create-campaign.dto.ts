import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CampaignCategory } from '@prisma/client';

export const CreateCampaignSchema = z.object({
  title: z
    .string()
    .min(10, 'Judul minimal 10 karakter')
    .max(150, 'Judul maksimal 150 karakter'),

  shortDesc: z
    .string()
    .min(20, 'Deskripsi Singkat minimal 20 Karakter')
    .max(300, 'Deskripsi singkat minimal 300 karakter'),

  coverImageUrl: z.url('URL Gambar tidak valid').optional(),

  category: z.enum(CampaignCategory),

  description: z.string().min(100, 'Deskripsi minimal 100 karakter'),

  targetAmount: z
    .number()
    .min(10000, 'Target donasi minimal Rp10.000')
    .positive('Target donasi harus lebih dari 0'),

  isUrgent: z.boolean().optional().default(false),

  deadlineAt: z.iso
    .datetime()
    .refine((date) => new Date(date) > new Date(), {
      message: 'Deadline harus lebih besar dari hari ini',
    })
    .optional(),
});

export class CreateCampaignDto extends createZodDto(CreateCampaignSchema) {}
