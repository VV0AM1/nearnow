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
let PostsService = class PostsService {
    prisma;
    gateway;
    constructor(prisma, gateway) {
        this.prisma = prisma;
        this.gateway = gateway;
    }
    async create(createPostInput, authorId) {
        const post = await this.prisma.post.create({
            data: {
                ...createPostInput,
                authorId,
            },
            include: {
                author: true,
                neighborhood: true,
            },
        });
        this.gateway.server.emit('postCreated', post);
        return post;
    }
    findAll() {
        return this.prisma.post.findMany({
            include: {
                author: true,
                neighborhood: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getFeed(lat, long, radiusKm, category) {
        const posts = await this.prisma.$queryRaw `
      SELECT id,
      ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) AS distance
      FROM "Post"
      WHERE ( 6371 * acos( cos( radians(${lat}) ) * cos( radians( latitude ) ) * cos( radians( longitude ) - radians(${long}) ) + sin( radians(${lat}) ) * sin( radians( latitude ) ) ) ) < ${radiusKm}
      ${category && category !== 'ALL' ? client_1.Prisma.sql `AND category = ${category}::"Category"` : client_1.Prisma.sql ``}
      ORDER BY distance ASC
      LIMIT 100;
    `;
        const ids = posts.map(p => p.id);
        if (ids.length === 0)
            return [];
        const fullPosts = await this.prisma.post.findMany({
            where: { id: { in: ids } },
            include: { author: true, neighborhood: true },
        });
        return ids.map(id => fullPosts.find(p => p.id === id)).filter(Boolean);
    }
};
exports.PostsService = PostsService;
exports.PostsService = PostsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        app_gateway_1.AppGateway])
], PostsService);
//# sourceMappingURL=posts.service.js.map