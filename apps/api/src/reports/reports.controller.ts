import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportInput } from './dto/create-report.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Body() createReportInput: CreateReportInput, @Request() req) {
        return this.reportsService.create(createReportInput, req.user.id);
    }
}
