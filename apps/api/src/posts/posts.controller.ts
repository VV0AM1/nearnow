import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';

@Controller('posts')
export class PostsController {
    constructor(private readonly postsService: PostsService) { }

    @Get()
    findAll() {
        return this.postsService.findAll();
    }

    @Get('feed')
    getFeed(
        @Query('latitude') lat: string,
        @Query('longitude') long: string,
        @Query('radius') radius: string,
        @Query('category') category: string,
    ) {
        const r = radius ? parseFloat(radius) : 10;
        const l1 = lat ? parseFloat(lat) : 0;
        const l2 = long ? parseFloat(long) : 0;
        return this.postsService.getFeed(l1, l2, r, category);
    }

    @Post()
    create(@Body() createPostInput: CreatePostInput, @Body('authorId') authorId: string) {
        // In a real app, authorId comes from JWT Guard (req.user.id)
        return this.postsService.create(createPostInput, authorId);
    }
}
