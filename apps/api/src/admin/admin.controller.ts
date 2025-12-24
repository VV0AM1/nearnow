import { Controller, Get, Param, Patch, Delete, UseGuards, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, ReportStatus } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('users')
  getUsers() {
    return this.adminService.findAllUsers();
  }

  @Patch('users/:id/block')
  toggleBlockUser(@Param('id') id: string) {
    return this.adminService.toggleBlockUser(id);
  }

  @Get('reports')
  getReports() {
    return this.adminService.getReports();
  }

  @Patch('reports/:id/resolve')
  resolveReport(@Param('id') id: string, @Body('status') status: ReportStatus) {
    return this.adminService.resolveReport(id, status);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }
}
