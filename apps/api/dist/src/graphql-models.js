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
exports.AuthResponse = exports.Comment = exports.Neighborhood = exports.Post = exports.User = void 0;
const graphql_1 = require("@nestjs/graphql");
const client_1 = require("@prisma/client");
(0, graphql_1.registerEnumType)(client_1.Role, { name: 'Role', description: 'User roles' });
(0, graphql_1.registerEnumType)(client_1.Category, { name: 'Category' });
let User = class User {
    id;
    email;
    name;
    avatar;
    bio;
    role;
    createdAt;
    updatedAt;
    posts;
};
exports.User = User;
__decorate([
    (0, graphql_1.Field)(() => graphql_1.ID),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "avatar", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.Role),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, graphql_1.Field)(() => [Post], { nullable: true }),
    __metadata("design:type", Array)
], User.prototype, "posts", void 0);
exports.User = User = __decorate([
    (0, graphql_1.ObjectType)()
], User);
let Post = class Post {
    id;
    title;
    content;
    imageUrl;
    category;
    latitude;
    longitude;
    authorId;
    author;
    neighborhoodId;
    neighborhood;
    createdAt;
    updatedAt;
};
exports.Post = Post;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Post.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Post.prototype, "title", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "content", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "imageUrl", void 0);
__decorate([
    (0, graphql_1.Field)(() => client_1.Category),
    __metadata("design:type", String)
], Post.prototype, "category", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], Post.prototype, "latitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], Post.prototype, "longitude", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Post.prototype, "authorId", void 0);
__decorate([
    (0, graphql_1.Field)(() => User),
    __metadata("design:type", User)
], Post.prototype, "author", void 0);
__decorate([
    (0, graphql_1.Field)({ nullable: true }),
    __metadata("design:type", String)
], Post.prototype, "neighborhoodId", void 0);
__decorate([
    (0, graphql_1.Field)(() => Neighborhood, { nullable: true }),
    __metadata("design:type", Object)
], Post.prototype, "neighborhood", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], Post.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], Post.prototype, "updatedAt", void 0);
exports.Post = Post = __decorate([
    (0, graphql_1.ObjectType)()
], Post);
let Neighborhood = class Neighborhood {
    id;
    name;
    city;
    latitude;
    longitude;
    radiusKm;
    posts;
    createdAt;
    updatedAt;
};
exports.Neighborhood = Neighborhood;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Neighborhood.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Neighborhood.prototype, "name", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Neighborhood.prototype, "city", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], Neighborhood.prototype, "latitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], Neighborhood.prototype, "longitude", void 0);
__decorate([
    (0, graphql_1.Field)(() => graphql_1.Float),
    __metadata("design:type", Number)
], Neighborhood.prototype, "radiusKm", void 0);
__decorate([
    (0, graphql_1.Field)(() => [Post], { nullable: true }),
    __metadata("design:type", Array)
], Neighborhood.prototype, "posts", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], Neighborhood.prototype, "createdAt", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], Neighborhood.prototype, "updatedAt", void 0);
exports.Neighborhood = Neighborhood = __decorate([
    (0, graphql_1.ObjectType)()
], Neighborhood);
let Comment = class Comment {
    id;
    content;
    authorId;
    author;
    postId;
    createdAt;
};
exports.Comment = Comment;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Comment.prototype, "id", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Comment.prototype, "content", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Comment.prototype, "authorId", void 0);
__decorate([
    (0, graphql_1.Field)(() => User),
    __metadata("design:type", User)
], Comment.prototype, "author", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], Comment.prototype, "postId", void 0);
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", Date)
], Comment.prototype, "createdAt", void 0);
exports.Comment = Comment = __decorate([
    (0, graphql_1.ObjectType)()
], Comment);
let AuthResponse = class AuthResponse {
    accessToken;
    user;
};
exports.AuthResponse = AuthResponse;
__decorate([
    (0, graphql_1.Field)(),
    __metadata("design:type", String)
], AuthResponse.prototype, "accessToken", void 0);
__decorate([
    (0, graphql_1.Field)(() => User),
    __metadata("design:type", User)
], AuthResponse.prototype, "user", void 0);
exports.AuthResponse = AuthResponse = __decorate([
    (0, graphql_1.ObjectType)()
], AuthResponse);
//# sourceMappingURL=graphql-models.js.map