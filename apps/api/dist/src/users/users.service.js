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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    create(createUserInput) {
        return this.prisma.user.create({
            data: createUserInput,
        });
    }
    findAll() {
        return this.prisma.user.findMany();
    }
    findOne(id) {
        return this.prisma.user.findUnique({
            where: { id },
        });
    }
    async findProfile(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { posts: true, votes: true, comments: true }
                }
            }
        });
        if (!user)
            return null;
        const points = user.reputation || 0;
        const POINTS_PER_LEVEL = 5;
        const level = Math.floor(points / POINTS_PER_LEVEL) + 1;
        let rank = 'Novice';
        if (level >= 50)
            rank = 'Platinum';
        else if (level >= 30)
            rank = 'Gold';
        else if (level >= 15)
            rank = 'Silver';
        else if (level >= 5)
            rank = 'Bronze';
        const nextLevelPoints = level * POINTS_PER_LEVEL;
        const currentLevelStartPoints = (level - 1) * POINTS_PER_LEVEL;
        const pointsInCurrentLevel = points - currentLevelStartPoints;
        const progress = (pointsInCurrentLevel / POINTS_PER_LEVEL) * 100;
        return {
            ...user,
            gamification: {
                level,
                rank,
                points,
                nextLevelPoints,
                progress
            }
        };
    }
    update(id, updateUserInput) {
        const { id: _, ...data } = updateUserInput;
        return this.prisma.user.update({
            where: { id },
            data: data,
        });
    }
    remove(id) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
    async getSavedPosts(userId) {
        return this.prisma.savedPost.findMany({
            where: { userId },
            include: { post: true },
            orderBy: { createdAt: 'desc' }
        });
    }
    async toggleSavedPost(userId, postId) {
        const existing = await this.prisma.savedPost.findUnique({
            where: {
                userId_postId: { userId, postId }
            }
        });
        if (existing) {
            await this.prisma.savedPost.delete({
                where: { id: existing.id }
            });
            return { saved: false };
        }
        else {
            await this.prisma.savedPost.create({
                data: { userId, postId }
            });
            return { saved: true };
        }
    }
    async isPostSaved(userId, postId) {
        const count = await this.prisma.savedPost.count({
            where: { userId, postId }
        });
        return count > 0;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map