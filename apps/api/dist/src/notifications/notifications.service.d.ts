import { PrismaService } from '../prisma.service';
import { Post, NotificationType } from '@prisma/client';
import { AppGateway } from '../app.gateway';
export declare class NotificationsService {
    private prisma;
    private gateway;
    constructor(prisma: PrismaService, gateway: AppGateway);
    notifyUsers(post: Post): Promise<void>;
    sendNotification(userId: string, type: NotificationType, title: string, message: string, postId?: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string | null;
        message: string;
        read: boolean;
        userId: string;
        postId: string | null;
        createdAt: Date;
    }>;
    getSettings(userId: string): Promise<{
        id: string;
        userId: string;
        emailAlerts: boolean;
        pushAlerts: boolean;
        pushEnabled: boolean;
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: import("@prisma/client").$Enums.Category[];
        updatedAt: Date;
    } | {
        id: string;
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: never[];
        pushEnabled: boolean;
        userId: string;
    }>;
    upsertSettings(userId: string, radiusKm: number, latitude: number, longitude: number, categories: any[], pushEnabled: boolean): Promise<{
        id: string;
        userId: string;
        emailAlerts: boolean;
        pushAlerts: boolean;
        pushEnabled: boolean;
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: import("@prisma/client").$Enums.Category[];
        updatedAt: Date;
    }>;
    getUserNotifications(userId: string): Promise<({
        post: {
            id: string;
            title: string;
            content: string | null;
            imageUrl: string | null;
            category: import("@prisma/client").$Enums.Category;
            latitude: number;
            longitude: number;
            authorId: string;
            neighborhoodId: string | null;
            likes: number;
            createdAt: Date;
            updatedAt: Date;
        } | null;
    } & {
        id: string;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string | null;
        message: string;
        read: boolean;
        userId: string;
        postId: string | null;
        createdAt: Date;
    })[]>;
    markAsRead(id: string): Promise<{
        id: string;
        type: import("@prisma/client").$Enums.NotificationType;
        title: string | null;
        message: string;
        read: boolean;
        userId: string;
        postId: string | null;
        createdAt: Date;
    }>;
    private getDistanceFromLatLonInKm;
    private deg2rad;
}
