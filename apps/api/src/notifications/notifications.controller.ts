import { Controller, Get, Post, Put, Body, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('me')
    getMyNotifications(@Req() req: any) {
        return this.notificationsService.getUserNotifications(req.user.id);
    }

    @Get('me/settings')
    getMySettings(@Req() req: any) {
        return this.notificationsService.getSettings(req.user.id);
    }

    @Put('me/settings')
    updateMySettings(
        @Req() req: any,
        @Body() body: { radiusKm: number, latitude: number, longitude: number, categories: any[], pushEnabled: boolean }
    ) {
        return this.notificationsService.upsertSettings(
            req.user.id,
            body.radiusKm,
            body.latitude,
            body.longitude,
            body.categories,
            body.pushEnabled
        );
    }

    @Post('me/read/:id')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }

    @Get(':userId')
    getUserNotifications(@Param('userId') userId: string) {
        return this.notificationsService.getUserNotifications(userId);
    }

    @Get('settings/:userId')
    getSettings(@Param('userId') userId: string) {
        return this.notificationsService.getSettings(userId);
    }

    @Put('settings/:userId')
    updateSettings(
        @Param('userId') userId: string,
        @Body() body: { radiusKm: number, latitude: number, longitude: number, categories: any[], pushEnabled: boolean }
    ) {
        return this.notificationsService.upsertSettings(
            userId,
            body.radiusKm,
            body.latitude,
            body.longitude,
            body.categories,
            body.pushEnabled
        );
    }
}
