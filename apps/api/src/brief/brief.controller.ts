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
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { BriefService } from './brief.service';
import {
  BriefQueryDto,
  CreateSavedAreaDto,
  UpdateBriefPreferencesDto,
} from './brief.dto';

/** "Since you last checked" brief and saved areas. Acts on the signed-in user only. */
@Controller('brief')
@UseGuards(JwtAuthGuard)
export class BriefController {
  constructor(private readonly brief: BriefService) {}

  @Get()
  get(@CurrentUser() user: User, @Query() q: BriefQueryDto) {
    return this.brief.brief(user, q);
  }

  @Post('seen')
  @HttpCode(200)
  seen(@CurrentUser() user: User) {
    return this.brief.markSeen(user);
  }

  @Get('preferences')
  preferences(@CurrentUser() user: User) {
    return this.brief.preferences(user);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdateBriefPreferencesDto,
  ) {
    return this.brief.updatePreferences(user, dto);
  }

  @Get('areas')
  areas(@CurrentUser() user: User) {
    return this.brief.listAreas(user);
  }

  @Post('areas')
  addArea(@CurrentUser() user: User, @Body() dto: CreateSavedAreaDto) {
    return this.brief.addArea(user, dto);
  }

  @Delete('areas/:id')
  removeArea(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.brief.removeArea(user, id);
  }
}
