import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { DonationStatus } from '@prisma/client';
import { querySchema } from 'src/common/dto/query.dto';

const QueryDonationSchema = querySchema.extend({
  status: z.nativeEnum(DonationStatus).optional(),

  campaignId: z.string().optional(),
});

const AdminQueryDonationSchema = QueryDonationSchema.extend({
  userId: z.string().optional(),
});

export class QueryDonationDto extends createZodDto(QueryDonationSchema) {}

export class AdminQueryDonationDto extends createZodDto(
  AdminQueryDonationSchema,
) {}
