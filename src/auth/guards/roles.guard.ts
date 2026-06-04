import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { CurrentUserData } from '../types/jwt-payload';

interface AuthenticatedRequest extends Request {
  user: CurrentUserData;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const hasRole = roles.includes(request.user.role);

    if (!hasRole) {
      throw new ForbiddenException('Anda tidak memiliki akses ke resource ini');
    }

    return roles.includes(request.user.role);
  }
}
