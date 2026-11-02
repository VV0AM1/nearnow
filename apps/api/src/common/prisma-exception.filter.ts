import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Maps known Prisma errors to client errors without leaking query details.
 * Everything else keeps Nest's default handling.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Prisma');

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const map: Record<string, [HttpStatus, string]> = {
      P2025: [HttpStatus.NOT_FOUND, 'Not found'],
      P2002: [HttpStatus.CONFLICT, 'Already exists'],
      P2003: [HttpStatus.BAD_REQUEST, 'Referenced item does not exist'],
    };
    const [status, message] = map[exception.code] ?? [
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Internal server error',
    ];
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Unhandled Prisma error ${exception.code}`);
    }
    res.status(status).json({ statusCode: status, message });
  }
}
