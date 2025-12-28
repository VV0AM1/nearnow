import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Req, Get, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: any) {
        // Fetch fresh profile with stats instead of just returning JWT payload user
        return this.usersService.findProfile(req.user.id);
    }


    @Post('avatar')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = file.originalname.split('.').pop();
                cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
            }
        })
    }))
    async uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
        if (!file) throw new Error('No file uploaded');
        const userId = req.user.id; // Corrected: JwtStrategy returns full User object, so use .id (not .sub)
        const avatarUrl = `/uploads/${file.filename}`;
        return this.usersService.update(userId, { id: userId, avatar: avatarUrl });
    }

    @Get(':id/saved')
    @UseGuards(JwtAuthGuard)
    async getSavedPosts(@Param('id') id: string) {
        return this.usersService.getSavedPosts(id);
    }

    @Post(':id/saved/:postId')
    @UseGuards(JwtAuthGuard)
    async toggleSavedPost(@Param('id') userId: string, @Param('postId') postId: string) {
        return this.usersService.toggleSavedPost(userId, postId);
    }

    @Get(':id/saved/:postId/check')
    @UseGuards(JwtAuthGuard)
    async checkSavedStatus(@Param('id') userId: string, @Param('postId') postId: string) {
        const isSaved = await this.usersService.isPostSaved(userId, postId);
        return { isSaved };
    }
}
