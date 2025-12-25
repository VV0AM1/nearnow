import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ReportStatus, Role } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async findAllUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, email: true, role: true, isBlocked: true, createdAt: true,
                _count: { select: { posts: true, reports: true } }
            }
        });
    }

    async toggleBlockUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return this.prisma.user.update({
            where: { id: userId },
            data: { isBlocked: !user.isBlocked },
        });
    }

    async getReports() {
        return this.prisma.report.findMany({
            where: { status: ReportStatus.PENDING },
            include: {
                post: { select: { id: true, title: true, content: true, imageUrl: true } },
                reporter: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async resolveReport(reportId: string, status: ReportStatus) {
        return this.prisma.report.update({
            where: { id: reportId },
            data: { status },
        });
    }

    async deletePost(postId: string) {
        return this.prisma.post.delete({ where: { id: postId } });
    }
    async getStats() {
        const totalUsers = await this.prisma.user.count();
        const pendingReports = await this.prisma.report.count({
            where: { status: 'PENDING' }
        });
        // Assuming 'Active Alerts' refers to active posts for now
        const activeAlerts = await this.prisma.post.count();

        return {
            totalUsers,
            activeAlerts,
            pendingReports
        };
    }
}
