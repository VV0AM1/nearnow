import { AdminService } from './admin.service';
import { ReportStatus } from '@prisma/client';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getUsers(): Promise<{
        id: string;
        email: string;
        name: string | null;
        role: import("@prisma/client").$Enums.Role;
        isBlocked: boolean;
        createdAt: Date;
        _count: {
            posts: number;
            reports: number;
        };
    }[]>;
    toggleBlockUser(id: string): Promise<{
        id: string;
        email: string;
        name: string | null;
        avatar: string | null;
        bio: string | null;
        role: import("@prisma/client").$Enums.Role;
        reputation: number;
        isBlocked: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getReports(): Promise<({
        post: {
            id: string;
            title: string;
            content: string | null;
            imageUrl: string | null;
        };
        reporter: {
            id: string;
            name: string | null;
        };
    } & {
        id: string;
        reason: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        reporterId: string;
        postId: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    resolveReport(id: string, status: ReportStatus): Promise<{
        id: string;
        reason: string;
        status: import("@prisma/client").$Enums.ReportStatus;
        reporterId: string;
        postId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deletePost(id: string): Promise<{
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
    }>;
    getStats(): Promise<{
        totalUsers: number;
        activeAlerts: number;
        pendingReports: number;
    }>;
}
