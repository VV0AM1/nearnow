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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PostsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const fs_1 = require("fs");
const posts_service_1 = require("./posts.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PostsController = PostsController_1 = class PostsController {
    postsService;
    logger = new common_1.Logger(PostsController_1.name);
    constructor(postsService) {
        this.postsService = postsService;
    }
    onModuleInit() {
        const uploadDir = './uploads';
        if (!(0, fs_1.existsSync)(uploadDir)) {
            this.logger.log(`Creating upload directory: ${uploadDir}`);
            (0, fs_1.mkdirSync)(uploadDir, { recursive: true });
        }
    }
    findAll(authorId) {
        return this.postsService.findAll(authorId);
    }
    getFeed(lat, long, radius, category, search, page, limit) {
        const r = radius ? parseFloat(radius) : 10;
        const l1 = lat ? parseFloat(lat) : 0;
        const l2 = long ? parseFloat(long) : 0;
        const p = page ? parseInt(page) : 1;
        const l = limit ? parseInt(limit) : 20;
        return this.postsService.getFeed(l1, l2, r, category, search, p, l);
    }
    findOne(id) {
        return this.postsService.findOne(id);
    }
    create(body, file, req) {
        try {
            const createPostInput = {
                ...body,
                latitude: parseFloat(body.latitude),
                longitude: parseFloat(body.longitude),
            };
            const authorId = req.user.id;
            const imageUrl = file ? `/uploads/${file.filename}` : undefined;
            this.logger.log(`Creating post for user ${authorId} with image: ${imageUrl}`);
            return this.postsService.create(createPostInput, authorId, imageUrl);
        }
        catch (error) {
            this.logger.error(`Failed to create post: ${error.message}`, error.stack);
            throw error;
        }
    }
    async vote(id, body, req) {
        this.logger.log(`[Vote] User ${req.user.id} voting on post ${id} with type ${body.type}`);
        try {
            return await this.postsService.vote(id, req.user.id, body.type || 'UP');
        }
        catch (error) {
            this.logger.error(`[Vote] Failed: ${error.message}`, error.stack);
            throw error;
        }
    }
    async checkVote(id, req) {
        this.logger.log(`[CheckVote] Checking vote for user ${req.user.id} on post ${id}`);
        try {
            return await this.postsService.checkVoteStatus(id, req.user.id);
        }
        catch (error) {
            this.logger.error(`[CheckVote] Failed: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.PostsController = PostsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('authorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('feed'),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('radius')),
    __param(3, (0, common_1.Query)('category')),
    __param(4, (0, common_1.Query)('search')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "getFeed", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = (0, path_1.extname)(file.originalname);
                cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            }
        })
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", void 0)
], PostsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/vote'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "vote", null);
__decorate([
    (0, common_1.Get)(':id/vote/check'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PostsController.prototype, "checkVote", null);
exports.PostsController = PostsController = PostsController_1 = __decorate([
    (0, common_1.Controller)('posts'),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsController);
//# sourceMappingURL=posts.controller.js.map