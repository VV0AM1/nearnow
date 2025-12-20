"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const app_gateway_1 = require("../app.gateway");
let NotificationsService = class NotificationsService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async notifyUsers(post) {
        const interestedSettings = await this.prisma.notificationSettings.findMany({
            where: {
                categories: { has: post.category }
            },
            include: { user: true }
        });
        const notificationsToCreate = [];
        for (const setting of interestedSettings) {
            if (setting.userId === post.authorId)
                continue;
            let isNearby = false;
            if (setting.latitude !== 0 && setting.longitude !== 0) {
                const dist = this.getDistanceFromLatLonInKm(post.latitude, post.longitude, setting.latitude, setting.longitude);
                if (dist <= setting.radiusKm) {
                    isNearby = true;
                }
            }
            else {
                isNearby = false;
            }
            if (isNearby) {
                notificationsToCreate.push({
                    userId: setting.userId,
                    type: client_1.NotificationType.POST_NEARBY,
                    title: "New Alert Nearby",
                    message: post.title,
                    postId: post.id,
                    read: false
                });
            }
        }
        if (notificationsToCreate.length > 0) {
            await this.prisma.notification.createMany({
                data: notificationsToCreate
            });
            notificationsToCreate.forEach(notif => {
                this.gateway.server.to(`user_${notif.userId}`).emit('notification', notif);
            });
        }
    }
    async sendNotification(userId, type, title, message, postId) {
        const notif = await this.prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                postId
            }
        });
        this.gateway.server.to(`user_${userId}`).emit('notification', notif);
        return notif;
    }
    async getSettings(userId) {
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
    async upsertSettings(userId, radiusKm, latitude, longitude, categories, pushEnabled) {
        return this.prisma.notificationSettings.upsert({
            where: { userId },
            update: { radiusKm, latitude, longitude, categories, pushEnabled, pushAlerts: pushEnabled },
            create: { userId, radiusKm, latitude, longitude, categories, pushEnabled, pushAlerts: pushEnabled }
        });
    }
    async getUserNotifications(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { post: true }
        });
    }
    async markAsRead(id) {
        return this.prisma.notification.update({
            where: { id },
            data: { read: true }
        });
    }
    getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371;
        var dLat = this.deg2rad(lat2 - lat1);
        var dLon = this.deg2rad(lon2 - lon1);
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_gateway_1.AppGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map