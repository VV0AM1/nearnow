import { Module } from '@nestjs/common';
import { BriefController } from './brief.controller';
import { BriefService } from './brief.service';

@Module({
  controllers: [BriefController],
  providers: [BriefService],
})
export class BriefModule {}
