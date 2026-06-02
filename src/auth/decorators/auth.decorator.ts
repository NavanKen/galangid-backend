import { applyDecorators, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

import { JwtGuard } from '../guards/jwt.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export function Auth(...roles: Role[]) {
  return applyDecorators(Roles(...roles), UseGuards(JwtGuard, RolesGuard));
}
