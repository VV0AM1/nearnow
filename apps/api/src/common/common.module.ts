import { Global, Module } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { AuditService } from './audit.service';

@Global()
@Module({
  providers: [RateLimitService, AuditService],
  exports: [RateLimitService, AuditService],
})
export class CommonModule {}
