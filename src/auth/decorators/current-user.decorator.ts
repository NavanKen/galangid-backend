import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { CurrentUserData } from '../types/jwt-payload';
interface AuthenticatedRequest extends Request {
  user: CurrentUserData;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    return data ? request.user[data] : request.user;
  },
);
