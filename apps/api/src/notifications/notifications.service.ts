import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Post, NotificationType, Prisma } from '@prisma/client';

import { AppGateway } from '../app.gateway';

@Injectable()
export class NotificationsService {
    constructor(
        private prisma: PrismaService,
        private gateway: AppGateway
    ) { }

    async notifyUsers(post: Post) {
        // 1. Find users who have enabled notifications for this category
        const interestedSettings = await this.prisma.notificationSettings.findMany({
            where: {
                categories: { has: post.category }
            },
            include: { user: true }
        });

        const notificationsToCreate: Prisma.NotificationCreateManyInput[] = [];

        for (const setting of interestedSettings) {
            // Don't notify the author
            if (setting.userId === post.authorId) continue;

            // Check distance if setting has location
            let isNearby = false;
            // Ensure latitude/longitude are treated as numbers (default 0.0)
            if (setting.latitude !== 0 && setting.longitude !== 0) {
                const dist = this.getDistanceFromLatLonInKm(
                    post.latitude, post.longitude,
                    setting.latitude, setting.longitude
                );
                if (dist <= setting.radiusKm) {
                    isNearby = true;
                }
            } else {
                // Fallback: If user hasn't set a location, do not notify by default for "Nearby" alerts.
                // Or we could notify global alerts? For now, risk of spam is high. 
                isNearby = false;
            }

            if (isNearby) {
                notificationsToCreate.push({
                    userId: setting.userId,
                    type: NotificationType.POST_NEARBY,
                    title: "New Alert Nearby", // Optional but good to have
                    message: post.title, // Use post title as message
                    postId: post.id,
                    read: false
                });
            }
        }

        if (notificationsToCreate.length > 0) {
            await this.prisma.notification.createMany({
                data: notificationsToCreate
            });

            // Emit socket events to each user
            notificationsToCreate.forEach(notif => {
                this.gateway.server.to(`user_${notif.userId}`).emit('notification', notif);
            });
        }
    }

    async sendNotification(userId: string, type: NotificationType, title: string, message: string, postId?: string) {
        const notif = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                postId
            }
        });

        // Emit socket event
        this.gateway.server.to(`user_${userId}`).emit('notification', notif);
        return notif;
    }

    async getSettings(userId: string) {
        const settings = await this.prisma.notificationSettings.findUnique({
            where: { userId }
        });
        if (!settings) {
            return {
                id: 'default',
                radiusKm: 5,
                latitude: 0,
                longitude: 0,
                categories: [],
                pushEnabled: false,
                userId
            };
        }
        return settings;
    }

    async upsertSettings(userId: string, radiusKm: number, latitude: number, longitude: number, categories: any[], pushEnabled: boolean) {
        return this.prisma.notificationSettings.upsert({
            where: { userId },
            update: { radiusKm, latitude, longitude, categories, pushEnabled, pushAlerts: pushEnabled },
            create: { userId, radiusKm, latitude, longitude, categories, pushEnabled, pushAlerts: pushEnabled }
        });
    }

    async getUserNotifications(userId: string) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { post: true }
        });
    }

    async markAsRead(id: string) {
        return this.prisma.notification.update({
            where: { id },
            data: { read: true }
        });
    }

    private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        var R = 6371;
        var dLat = this.deg2rad(lat2 - lat1);
        var dLon = this.deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }
}
