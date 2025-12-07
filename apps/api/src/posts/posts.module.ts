import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PrismaModule } from '../prisma.module';
import { PostsController } from './posts.controller';

@Module({
    imports: [PrismaModule],
    providers: [PostsResolver, PostsService],
    controllers: [PostsController],
    exports: [PostsService]
})
export class PostsModule { }
