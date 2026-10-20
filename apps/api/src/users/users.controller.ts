import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { User } from '@prisma/client';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { imageUploadOptions } from '../uploads/uploads.service';
import {
  DeleteAccountDto,
  SetSavedDto,
  UpdateProfileDto,
} from './dto/users.dto';

/** All routes act on the authenticated user; there are no `:userId` variants. */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getProfile(@CurrentUser() user: User) {
    return this.usersService.findProfile(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: User, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, body);
  }

  /** Legacy path used by the web client. */
  @Patch('profile')
  updateProfile(@CurrentUser() user: User, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.updateAvatar(user.id, file);
  }

  @Delete('me')
  deleteMe(@CurrentUser() user: User, @Body() _body: DeleteAccountDto) {
    return this.usersService.deleteAccount(user.id);
  }

  @Get('me/saved')
  getMySavedPosts(@CurrentUser() user: User) {
    return this.usersService.getSavedPosts(user.id);
  }

  @Post('me/saved/:postId')
  toggleMySavedPost(
    @CurrentUser() user: User,
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() body: SetSavedDto,
  ) {
    return this.usersService.setSaved(user.id, postId, body?.saved);
  }

  @Get('me/saved/:postId/check')
  async checkMySavedStatus(
    @CurrentUser() user: User,
    @Param('postId', ParseUUIDPipe) postId: string,
  ) {
    return { isSaved: await this.usersService.isPostSaved(user.id, postId) };
  }
}
