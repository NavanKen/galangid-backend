import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.email({
    message: 'Email tidak valid',
  }),

  username: z
    .string({ error: 'Username Wajib Diisi' })
    .min(3, {
      message: 'Username minimal 3 karakter',
    })
    .max(30, {
      message: 'Username maksimal 30 karakter',
    })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username hanya boleh huruf, angka, dan underscore',
    }),

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
});

export const loginSchema = z.object({
  email: z.email({
    message: 'Email tidak valid',
  }),

  password: z.string().min(1, {
    message: 'Password wajib diisi',
  }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

export class RegisterDto extends createZodDto(registerSchema) {}

export class LoginDto extends createZodDto(loginSchema) {}

export class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
