import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role, type User } from '@prisma/client';
import { PostsService } from './posts.service';
import {
  AuthorPostsQueryDto,
  ConfirmPostDto,
  CreatePostDto,
  FeedQueryDto,
  RemovePostDto,
  ResolvePostDto,
  VoteDto,
} from './dto/post.dto';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { imageUploadOptions } from '../uploads/uploads.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  /** Posts by one author (profile view). Requires an author id; never returns everything. */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  byAuthor(@Query() q: AuthorPostsQueryDto, @CurrentUser() viewer?: User) {
    return this.postsService.findByAuthor(q.authorId, q.page, q.limit, viewer);
  }

  /** Location-bounded, paginated feed used by both the list and the map. */
  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  feed(@Query() q: FeedQueryDto, @CurrentUser() viewer?: User) {
    return this.postsService.getFeed(q, viewer);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() viewer?: User,
  ) {
    return this.postsService.findOne(id, viewer);
  }

  /** Accepts JSON or multipart/form-data with an optional image in field `file`. */
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  create(
    @Body() body: CreatePostDto,
    @CurrentUser() user: User,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.postsService.create(body, user, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteOwn(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.postsService.deleteOwn(id, user);
  }

  @Post(':id/vote')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  vote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _body: VoteDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.toggleVote(id, user);
  }

  @Get(':id/vote/check')
  @UseGuards(JwtAuthGuard)
  checkVote(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.postsService.voteStatus(id, user);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ConfirmPostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.confirm(id, user, body.state);
  }

  @Patch(':id/resolve')
  @UseGuards(JwtAuthGuard)
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ResolvePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.resolve(id, user, body.note);
  }

  @Patch(':id/remove')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATOR)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RemovePostDto,
    @CurrentUser() user: User,
  ) {
    return this.postsService.remove(id, user, body.reason);
  }
}
