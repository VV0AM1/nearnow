import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { Request } from 'express';

type AuthedRequest = Request & { user?: User };

/** The authenticated user attached by JwtStrategy (undefined behind OptionalJwtAuthGuard). */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined =>
    context.switchToHttp().getRequest<AuthedRequest>().user,
);

/** Client IP for rate-limit keys (honours `trust proxy`). */
export const ClientIp = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const req = context.switchToHttp().getRequest<Request>();
    return req.ip || req.socket?.remoteAddress || 'unknown';
  },
);
