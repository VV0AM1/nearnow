import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { Comment } from '../graphql-models';
import { CreateCommentInput } from './dto/create-comment.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Comment)
export class CommentsResolver {
    constructor(private readonly commentsService: CommentsService) { }

    @Mutation(() => Comment)
    @UseGuards(GqlAuthGuard)
    createComment(
        @CurrentUser() user: User,
        @Args('createCommentInput') createCommentInput: CreateCommentInput
    ) {
        return this.commentsService.create(user.id, createCommentInput);
    }

    @Query(() => [Comment], { name: 'comments' })
    findAll(@Args('postId', { type: () => String }) postId: string) {
        return this.commentsService.findByPostId(postId);
    }
}
