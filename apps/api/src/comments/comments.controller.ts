import { Controller, Post, Body, Get, Param, UseGuards, Request } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentInput } from './dto/create-comment.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() createCommentInput: CreateCommentInput) {
        return this.commentsService.create(req.user.id, createCommentInput);
    }

    @Get(':postId')
    findAll(@Param('postId') postId: string) {
        return this.commentsService.findByPostId(postId);
    }
}
