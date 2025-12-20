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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const posts_service_1 = require("./posts.service");
const graphql_models_1 = require("../graphql-models");
const create_post_input_1 = require("./dto/create-post.input");
const common_1 = require("@nestjs/common");
const gql_auth_guard_1 = require("../auth/gql-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let PostsResolver = class PostsResolver {
    postsService;
    constructor(postsService) {
        this.postsService = postsService;
    }
    createPost(user, createPostInput) {
        return this.postsService.create(createPostInput, user.id);
    }
    findAll() {
        return this.postsService.findAll();
    }
    feed(latitude, longitude, radius) {
        return this.postsService.getFeed(latitude, longitude, radius);
    }
};
exports.PostsResolver = PostsResolver;
__decorate([
    (0, graphql_1.Mutation)(() => graphql_models_1.Post),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('createPostInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        create_post_input_1.CreatePostInput]),
    __metadata("design:returntype", void 0)
], PostsResolver.prototype, "createPost", null);
__decorate([
    (0, graphql_1.Query)(() => [graphql_models_1.Post], { name: 'posts' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PostsResolver.prototype, "findAll", null);
__decorate([
    (0, graphql_1.Query)(() => [graphql_models_1.Post], { name: 'feed' }),
    __param(0, (0, graphql_1.Args)('latitude', { type: () => graphql_1.Float })),
    __param(1, (0, graphql_1.Args)('longitude', { type: () => graphql_1.Float })),
    __param(2, (0, graphql_1.Args)('radius', { type: () => graphql_1.Float, defaultValue: 10 })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", void 0)
], PostsResolver.prototype, "feed", null);
exports.PostsResolver = PostsResolver = __decorate([
    (0, graphql_1.Resolver)(() => graphql_models_1.Post),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsResolver);
//# sourceMappingURL=posts.resolver.js.map