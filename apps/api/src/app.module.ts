import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { CommonModule } from './common/common.module';
import { GatewayModule } from './gateway.module';
import { UploadsModule } from './uploads/uploads.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { PostsModule } from './posts/posts.module';
import { NeighborhoodsModule } from './neighborhoods/neighborhoods.module';
import { CommentsModule } from './comments/comments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { AdminModule } from './admin/admin.module';
import { LostFoundModule } from './lost-found/lost-found.module';
import { BriefModule } from './brief/brief.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    GatewayModule,
    UploadsModule,
    GeocodingModule,
    UsersModule,
    AuthModule,
    EmailModule,
    PostsModule,
    NeighborhoodsModule,
    CommentsModule,
    NotificationsModule,
    ReportsModule,
    AdminModule,
    LostFoundModule,
    BriefModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
