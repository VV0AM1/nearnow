import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { CommentsService } from './comments.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser() user: User, @Body() body: CreateCommentInput) {
    return this.commentsService.create(user.id, body);
  }

  @Get(':postId')
  findAll(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.commentsService.findByPostId(postId);
  }
}
