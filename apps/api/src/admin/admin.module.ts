import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ReportsModule } from '../reports/reports.module';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [ReportsModule, PostsModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
