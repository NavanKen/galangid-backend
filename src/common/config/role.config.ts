import { Role } from '@prisma/client';

export const role = {
  admin: Role.ADMIN,
  campaigner: Role.CAMPAIGNER,
  donor: Role.DONOR,
};
