import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ReportStatus, Role, type User } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { ReportsService } from '../reports/reports.service';
import { PostsService } from '../posts/posts.service';

class ReviewReportDto {
  @IsIn([ReportStatus.RESOLVED, ReportStatus.DISMISSED])
  status: ReportStatus;
}

class ReasonDto {
  @IsOptional()
  @IsString()
  @MaxLength(280)
  reason?: string;
}

/** Moderation endpoints. Account management is admin-only; content review allows moderators. */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MODERATOR)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly reports: ReportsService,
    private readonly posts: PostsService,
  ) {}

  @Get('users')
  @Roles(Role.ADMIN)
  getUsers() {
    return this.adminService.findAllUsers();
  }

  @Patch('users/:id/block')
  @Roles(Role.ADMIN)
  toggleBlockUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: User,
    @Body() body: ReasonDto,
  ) {
    return this.adminService.toggleBlockUser(id, admin.id, body?.reason);
  }

  @Get('reports')
  getReports() {
    return this.reports.listPending();
  }

  @Patch('reports/:id/resolve')
  resolveReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ReviewReportDto,
    @CurrentUser() mod: User,
  ) {
    return this.reports.review(id, mod.id, body.status);
  }

  /** Soft-removes a post (kept for audit, hidden from the public). */
  @Delete('posts/:id')
  deletePost(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() mod: User,
    @Body() body: ReasonDto,
  ) {
    return this.posts.remove(
      id,
      mod,
      body?.reason || 'Removed after moderator review',
    );
  }

  @Get('audit/:type/:id')
  audit(@Param('type') type: string, @Param('id', ParseUUIDPipe) id: string) {
    const t = type.toUpperCase();
    if (t !== 'POST' && t !== 'REPORT' && t !== 'USER') return [];
    return this.adminService.auditLog(t, id);
  }

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }
}
