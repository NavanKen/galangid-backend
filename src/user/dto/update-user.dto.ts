import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const updateUserSchema = z.object({
  email: z
    .email({
      message: 'Email tidak valid',
    })
    .optional(),

  displayName: z
    .string({ error: 'Nama wajib diisi' })
    .min(2, {
      message: 'Nama minimal 2 karakter',
    })
    .max(50, {
      message: 'Nama maksimal 50 karakter',
    })
    .optional(),
  role: z.enum(['DONOR', 'CAMPAIGNER', 'ADMIN']).optional(),

  phone: z
    .string()
    .regex(/^[0-9+\-\s]+$/, {
      message: 'Nomor telepon tidak valid',
    })
    .optional(),
});

export class UpdateUserDto extends createZodDto(updateUserSchema) {}
