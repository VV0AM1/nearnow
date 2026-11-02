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
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import {
  ListNotificationsQueryDto,
  RegisterDeviceDto,
  UpdateNotificationSettingsDto,
} from './dto/notification.dto';

/** Every route acts on the authenticated user only; no route accepts a user id. */
@Controller('notifications/me')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly push: PushService,
  ) {}

  @Get()
  list(@CurrentUser() user: User, @Query() q: ListNotificationsQueryDto) {
    return this.notifications.list(user.id, q.page, q.limit);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: User) {
    return this.notifications.unreadCount(user.id);
  }

  @Post('read/:id')
  @HttpCode(200)
  markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.notifications.markAsRead(user.id, id);
  }

  @Post('read-all')
  @HttpCode(200)
  markAllAsRead(@CurrentUser() user: User) {
    return this.notifications.markAllAsRead(user.id);
  }

  @Get('settings')
  getSettings(@CurrentUser() user: User) {
    return this.notifications.getSettings(user.id);
  }

  @Put('settings')
  replaceSettings(
    @CurrentUser() user: User,
    @Body() body: UpdateNotificationSettingsDto,
  ) {
    return this.notifications.updateSettings(user.id, body);
  }

  @Patch('settings')
  updateSettings(
    @CurrentUser() user: User,
    @Body() body: UpdateNotificationSettingsDto,
  ) {
    return this.notifications.updateSettings(user.id, body);
  }

  @Post('devices')
  @HttpCode(200)
  registerDevice(@CurrentUser() user: User, @Body() body: RegisterDeviceDto) {
    return this.push.registerDevice(user.id, body.token, body.platform);
  }

  @Delete('devices/:token')
  revokeDevice(@CurrentUser() user: User, @Param('token') token: string) {
    return this.push.revokeDevice(user.id, token);
  }
}
