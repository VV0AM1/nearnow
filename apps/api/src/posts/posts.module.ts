import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PrismaModule } from '../prisma.module';
import { PostsController } from './posts.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [PrismaModule, NotificationsModule, AuthModule],
    providers: [PostsResolver, PostsService],
    controllers: [PostsController],
    exports: [PostsService]
})
export class PostsModule { }
