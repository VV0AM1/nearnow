import type { Request } from 'express';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/**
 * Attaches the user when a valid bearer token is present, otherwise continues
 * anonymously. A present-but-invalid token is still rejected (401) so clients
 * learn their session expired instead of silently seeing a logged-out view.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.headers?.authorization) return true;
    return super.canActivate(context);
  }
}
