import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
// @UseGuards(JwtAuthGuard) // In real app
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

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

    @Post(':id/read')
    markAsRead(@Param('id') id: string) {
        return this.notificationsService.markAsRead(id);
    }
}
