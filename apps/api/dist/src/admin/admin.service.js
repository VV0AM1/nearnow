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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
let AdminService = class AdminService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAllUsers() {
        return this.prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, email: true, role: true, isBlocked: true, createdAt: true,
                _count: { select: { posts: true, reports: true } }
            }
        });
    }
    async toggleBlockUser(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.prisma.user.update({
            where: { id: userId },
            data: { isBlocked: !user.isBlocked },
        });
    }
    async getReports() {
        return this.prisma.report.findMany({
            where: { status: client_1.ReportStatus.PENDING },
            include: {
                post: { select: { id: true, title: true, content: true, imageUrl: true } },
                reporter: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async resolveReport(reportId, status) {
        return this.prisma.report.update({
            where: { id: reportId },
            data: { status },
        });
    }
    async deletePost(postId) {
        return this.prisma.post.delete({ where: { id: postId } });
    }
    async getStats() {
        const totalUsers = await this.prisma.user.count();
        const pendingReports = await this.prisma.report.count({
            where: { status: 'PENDING' }
        });
        const activeAlerts = await this.prisma.post.count();
        return {
            totalUsers,
            activeAlerts,
            pendingReports
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map