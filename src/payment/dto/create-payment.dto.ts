import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaymentProvider } from '@prisma/client';

const createPaymentSchema = z.object({
  donationId: z.string().cuid(),

  provider: z.nativeEnum(PaymentProvider),
});

export class CreatePaymentDto extends createZodDto(createPaymentSchema) {}
