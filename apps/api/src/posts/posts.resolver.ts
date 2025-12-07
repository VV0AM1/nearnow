import { Resolver, Query, Mutation, Args, Float } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from '../graphql-models';
import { CreatePostInput } from './dto/create-post.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Post)
export class PostsResolver {
    constructor(private readonly postsService: PostsService) { }

    @Mutation(() => Post)
    @UseGuards(GqlAuthGuard)
    createPost(
        @CurrentUser() user: User,
        @Args('createPostInput') createPostInput: CreatePostInput,
    ) {
        return this.postsService.create(createPostInput, user.id);
    }

    @Query(() => [Post], { name: 'posts' })
    findAll() {
        return this.postsService.findAll();
    }

    @Query(() => [Post], { name: 'feed' })
    feed(
        @Args('latitude', { type: () => Float }) latitude: number,
        @Args('longitude', { type: () => Float }) longitude: number,
        @Args('radius', { type: () => Float, defaultValue: 10 }) radius: number,
    ) {
        return this.postsService.getFeed(latitude, longitude, radius);
    }
}
