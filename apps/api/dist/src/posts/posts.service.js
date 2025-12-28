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
exports.PostsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const client_1 = require("@prisma/client");
const app_gateway_1 = require("../app.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
let PostsService = class PostsService {
    prisma;
    gateway;
    notificationsService;
    constructor(prisma, gateway, notificationsService) {
        this.prisma = prisma;
        this.gateway = gateway;
        this.notificationsService = notificationsService;
    }
    isProfane(text) {
        const badWords = ['bad', 'badword', 'worst'];
        const lowerText = text.toLowerCase();
        return badWords.some(word => lowerText.includes(word));
    }
    async create(createPostInput, authorId, imageUrl) {
        if (this.isProfane(createPostInput.title) || (createPostInput.content && this.isProfane(createPostInput.content))) {
            throw new common_1.BadRequestException("Post contains inappropriate language.");
        }
        const { neighborhood: neighborhoodName, city: cityName, country: countryName, ...postData } = createPostInput;
        let neighborhoodId = postData.neighborhoodId;
        if (neighborhoodName && cityName) {
            const city = await this.prisma.city.upsert({
                where: { name: cityName },
                update: {},
                create: {
                    name: cityName,
                    country: countryName || 'Unknown',
                    latitude: postData.latitude,
                    longitude: postData.longitude
                }
            });
            let scoreUpdate = {
                totalCount: { increment: 1 }
            };
            if (['CRIME', 'DANGER'].includes(postData.category)) {
                scoreUpdate.crimeCount = { increment: 1 };
            }
            else if (postData.category === 'SAFETY') {
                scoreUpdate.safetyCount = { increment: 1 };
            }
            const neighborhood = await this.prisma.neighborhood.upsert({
                where: {
                    name_cityId: {
                        name: neighborhoodName,
                        cityId: city.id
                    }
                },
                update: scoreUpdate,
                create: {
                    name: neighborhoodName,
                    cityId: city.id,
                    latitude: postData.latitude,
                    longitude: postData.longitude,
                    ...scoreUpdate,
                    crimeCount: scoreUpdate.crimeCount?.increment || 0,
                    safetyCount: scoreUpdate.safetyCount?.increment || 0,
                    totalCount: 1
                }
            });
            neighborhoodId = neighborhood.id;
        }
        const post = await this.prisma.post.create({
            data: {
                ...postData,
                neighborhoodId,
                authorId,
                imageUrl,
            },
            include: {
                author: true,
                neighborhood: true,
            },
        });
        this.gateway.server.emit('postCreated', post);
        this.notificationsService.notifyUsers(post);
        return post;
    }
    findAll(authorId) {
        return this.prisma.post.findMany({
            where: authorId ? { authorId } : undefined,
            include: {
                author: true,
                neighborhood: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getFeed(lat, long, radiusKm, category, search, page = 1, limit = 20) {
        const latMin = lat - radiusKm / 111;
        const latMax = lat + radiusKm / 111;
        const longMin = long - radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));
        const longMax = long + radiusKm / (111 * Math.cos(lat * (Math.PI / 180)));
        console.log(`[getFeed] Search: "${search}", Category: "${category}", Radius: ${radiusKm}km`);
        const categories = category ? category.split(',') : ['ALL'];
        const hasAll = categories.includes('ALL');
        const offset = (page - 1) * limit;
        const posts = await this.prisma.$queryRaw `
      SELECT id,
      ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) AS distance
      FROM "Post"
      WHERE latitude BETWEEN ${latMin} AND ${latMax}
      AND longitude BETWEEN ${longMin} AND ${longMax}
      AND ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) < ${radiusKm}
      ${!hasAll && categories.length > 0 ? client_1.Prisma.sql `AND category::text IN (${client_1.Prisma.join(categories)})` : client_1.Prisma.sql ``}
      ${search ? client_1.Prisma.sql `AND (title ILIKE ${`%${search}%`} OR content ILIKE ${`%${search}%`})` : client_1.Prisma.sql ``}
      ORDER BY "createdAt" DESC, distance ASC
      LIMIT ${limit} OFFSET ${offset};
    `;
        console.log(`[getFeed] Found ${posts.length} posts`);
        const ids = posts.map(p => p.id);
        if (ids.length === 0)
            return [];
        const fullPosts = await this.prisma.post.findMany({
            where: { id: { in: ids } },
            include: {
                author: true,
                neighborhood: true,
                comments: true
            },
        });
        return ids.map(id => fullPosts.find(p => p.id === id)).filter(Boolean);
    }
    findOne(id) {
        return this.prisma.post.findUnique({
            where: { id },
            include: {
                author: true,
                neighborhood: true,
                comments: {
                    include: {
                        author: true
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                }
            }
        });
    }
    async vote(postId, userId, type) {
        const existingVote = await this.prisma.postVote.findUnique({
            where: {
                userId_postId: {
                    userId,
                    postId
                }
            }
        });
        if (existingVote) {
            if (existingVote.type === type) {
                return this.prisma.$transaction(async (tx) => {
                    await tx.postVote.delete({
                        where: { id: existingVote.id }
                    });
                    const post = await tx.post.update({
                        where: { id: postId },
                        data: { likes: { decrement: 1 } },
                        include: { author: true }
                    });
                    await tx.user.update({
                        where: { id: post.authorId },
                        data: { reputation: { decrement: 1 } }
                    });
                    return { ...post, voted: false };
                });
            }
            else {
                return;
            }
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.postVote.create({
                data: {
                    userId,
                    postId,
                    type
                }
            });
            const post = await tx.post.update({
                where: { id: postId },
                data: { likes: { increment: 1 } },
                include: { author: true }
            });
            await tx.user.update({
                where: { id: post.authorId },
                data: { reputation: { increment: 1 } }
            });
            return { ...post, voted: true };
        });
    }
    async checkVoteStatus(postId, userId) {
        const vote = await this.prisma.postVote.findUnique({
            where: { userId_postId: { userId, postId } }
        });
        return { hasVoted: !!vote, type: vote?.type };
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_gateway_1.AppGateway,
        notifications_service_1.NotificationsService])
], PostsService);
//# sourceMappingURL=posts.service.js.map