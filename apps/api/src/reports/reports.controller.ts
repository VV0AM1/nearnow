import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import type { User } from '@prisma/client';
import { ReportsService } from './reports.service';
import { CreateReportInput } from './dto/create-report.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: CreateReportInput, @CurrentUser() user: User) {
    return this.reportsService.create(body, user.id);
  }
}
