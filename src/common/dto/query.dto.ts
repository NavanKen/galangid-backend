import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
});

export class QueryGlobal extends createZodDto(querySchema) {}
