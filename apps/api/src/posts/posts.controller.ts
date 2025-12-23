import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors, UploadedFile, Param, Req, OnModuleInit, Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('posts')
export class PostsController implements OnModuleInit {
    private readonly logger = new Logger(PostsController.name);

    constructor(private readonly postsService: PostsService) { }

    onModuleInit() {
        const uploadDir = './uploads';
        if (!existsSync(uploadDir)) {
            this.logger.log(`Creating upload directory: ${uploadDir}`);
            mkdirSync(uploadDir, { recursive: true });
        }
    }

    @Get()
    findAll(@Query('authorId') authorId?: string) {
        return this.postsService.findAll(authorId);
    }

    @Get('feed')
    getFeed(
        @Query('latitude') lat: string,
        @Query('longitude') long: string,
        @Query('radius') radius: string,
        @Query('category') category: string,
        @Query('page') page: string,
        @Query('limit') limit: string,
    ) {
        const r = radius ? parseFloat(radius) : 10;
        const l1 = lat ? parseFloat(lat) : 0;
        const l2 = long ? parseFloat(long) : 0;
        const p = page ? parseInt(page) : 1;
        const l = limit ? parseInt(limit) : 20;
        return this.postsService.getFeed(l1, l2, r, category, p, l);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.postsService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = extname(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            }
        })
    }))
    create(
        @Body() body: any,
        @UploadedFile() file: Express.Multer.File,
        @Req() req: any
    ) {
        const createPostInput: CreatePostInput = {
            ...body,
            latitude: parseFloat(body.latitude),
            longitude: parseFloat(body.longitude),
        };
        const authorId = req.user.sub; // From JWT
        const imageUrl = file ? `/uploads/${file.filename}` : undefined;

        console.log('Creating post', { createPostInput, authorId, imageUrl });

        return this.postsService.create(createPostInput, authorId, imageUrl);
    }
    @Post(':id/vote')
    vote(
        @Param('id') id: string,
        @Body() body: { userId: string, type: 'UP' | 'DOWN' }
    ) {
        return this.postsService.vote(id, body.userId, body.type);
    }

    @Get(':id/vote/check')
    checkVote(@Param('id') id: string, @Query('userId') userId: string) {
        return this.postsService.checkVoteStatus(id, userId);
    }
}
