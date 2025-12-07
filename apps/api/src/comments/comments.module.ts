import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';
import { CommentsController } from './comments.controller';
import { PrismaModule } from '../prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [CommentsController],
    providers: [CommentsResolver, CommentsService],
})
export class CommentsModule { }
