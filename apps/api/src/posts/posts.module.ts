import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { LostFoundModule } from '../lost-found/lost-found.module';

@Module({
  imports: [NotificationsModule, LostFoundModule],
  providers: [PostsService],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
