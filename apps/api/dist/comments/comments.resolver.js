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
exports.CommentsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const comments_service_1 = require("./comments.service");
const graphql_models_1 = require("../graphql-models");
const create_comment_input_1 = require("./dto/create-comment.input");
const common_1 = require("@nestjs/common");
const gql_auth_guard_1 = require("../auth/gql-auth.guard");
const current_user_decorator_1 = require("../auth/current-user.decorator");
const user_entity_1 = require("../users/entities/user.entity");
let CommentsResolver = class CommentsResolver {
    commentsService;
    constructor(commentsService) {
        this.commentsService = commentsService;
    }
    createComment(user, createCommentInput) {
        return this.commentsService.create(user.id, createCommentInput);
    }
    findAll(postId) {
        return this.commentsService.findByPostId(postId);
    }
};
exports.CommentsResolver = CommentsResolver;
__decorate([
    (0, graphql_1.Mutation)(() => graphql_models_1.Comment),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, graphql_1.Args)('createCommentInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User,
        create_comment_input_1.CreateCommentInput]),
    __metadata("design:returntype", void 0)
], CommentsResolver.prototype, "createComment", null);
__decorate([
    (0, graphql_1.Query)(() => [graphql_models_1.Comment], { name: 'comments' }),
    __param(0, (0, graphql_1.Args)('postId', { type: () => String })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CommentsResolver.prototype, "findAll", null);
exports.CommentsResolver = CommentsResolver = __decorate([
    (0, graphql_1.Resolver)(() => graphql_models_1.Comment),
    __metadata("design:paramtypes", [comments_service_1.CommentsService])
], CommentsResolver);
//# sourceMappingURL=comments.resolver.js.map