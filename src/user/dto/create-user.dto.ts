import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.email({ message: 'Email tidak Valid' }),

  displayName: z
    .string({ error: 'Nama Wajib Diisi' })
    .min(2, {
      message: 'Nama minimal 2 karakter',
    })
    .max(50, {
      message: 'Nama maksimal 50 karakter',
    }),

  password: z
    .string({ error: 'Password Wajib Diisi' })
    .min(8, {
      message: 'Password minimal 8 karakter',
    })
    .max(72, {
      message: 'Password maksimal 72 karakter',
    }),
  phone: z
    .string()
    .regex(/^[0-9+\-\s]+$/, {
      message: 'Nomor telepon tidak valid',
    })
    .optional(),

  role: z.enum(['DONOR', 'CAMPAIGNER', 'ADMIN']).default('DONOR'),
});

export class CreateUserDto extends createZodDto(createUserSchema) {}
