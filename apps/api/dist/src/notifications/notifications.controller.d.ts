import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getMyNotifications(req: any): Promise<({
        post: {
            id: string;
            title: string;
            content: string | null;
            imageUrl: string | null;
            category: import(".prisma/client").$Enums.Category;
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
        type: import(".prisma/client").$Enums.NotificationType;
        title: string | null;
        message: string;
        read: boolean;
        userId: string;
        postId: string | null;
        createdAt: Date;
    })[]>;
    getMySettings(req: any): Promise<{
        id: string;
        userId: string;
        emailAlerts: boolean;
        pushAlerts: boolean;
        pushEnabled: boolean;
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: import(".prisma/client").$Enums.Category[];
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
    updateMySettings(req: any, body: {
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: any[];
        pushEnabled: boolean;
    }): Promise<{
        id: string;
        userId: string;
        emailAlerts: boolean;
        pushAlerts: boolean;
        pushEnabled: boolean;
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: import(".prisma/client").$Enums.Category[];
        updatedAt: Date;
    }>;
    markAsRead(id: string): Promise<{
        id: string;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string | null;
        message: string;
        read: boolean;
        userId: string;
        postId: string | null;
        createdAt: Date;
    }>;
    getUserNotifications(userId: string): Promise<({
        post: {
            id: string;
            title: string;
            content: string | null;
            imageUrl: string | null;
            category: import(".prisma/client").$Enums.Category;
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
        type: import(".prisma/client").$Enums.NotificationType;
        title: string | null;
        message: string;
        read: boolean;
        userId: string;
        postId: string | null;
        createdAt: Date;
    })[]>;
    getSettings(userId: string): Promise<{
        id: string;
        userId: string;
        emailAlerts: boolean;
        pushAlerts: boolean;
        pushEnabled: boolean;
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: import(".prisma/client").$Enums.Category[];
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
    updateSettings(userId: string, body: {
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: any[];
        pushEnabled: boolean;
    }): Promise<{
        id: string;
        userId: string;
        emailAlerts: boolean;
        pushAlerts: boolean;
        pushEnabled: boolean;
        radiusKm: number;
        latitude: number;
        longitude: number;
        categories: import(".prisma/client").$Enums.Category[];
        updatedAt: Date;
    }>;
}
