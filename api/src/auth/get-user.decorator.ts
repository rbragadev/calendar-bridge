import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from './jwt.types';

export const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
