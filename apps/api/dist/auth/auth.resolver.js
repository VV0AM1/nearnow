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
exports.AuthResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const auth_service_1 = require("./auth.service");
const graphql_models_1 = require("../graphql-models");
const create_auth_input_1 = require("./dto/create-auth.input");
const common_1 = require("@nestjs/common");
const gql_auth_guard_1 = require("./gql-auth.guard");
const current_user_decorator_1 = require("./current-user.decorator");
let AuthResolver = class AuthResolver {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    login(loginInput) {
        return this.authService.login(loginInput);
    }
    signup(signupInput) {
        return this.authService.signup(signupInput);
    }
    me(user) {
        return user;
    }
};
exports.AuthResolver = AuthResolver;
__decorate([
    (0, graphql_1.Mutation)(() => graphql_models_1.AuthResponse),
    __param(0, (0, graphql_1.Args)('loginInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_auth_input_1.LoginInput]),
    __metadata("design:returntype", void 0)
], AuthResolver.prototype, "login", null);
__decorate([
    (0, graphql_1.Mutation)(() => graphql_models_1.AuthResponse),
    __param(0, (0, graphql_1.Args)('signupInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_auth_input_1.SignupInput]),
    __metadata("design:returntype", void 0)
], AuthResolver.prototype, "signup", null);
__decorate([
    (0, graphql_1.Query)(() => graphql_models_1.User),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [graphql_models_1.User]),
    __metadata("design:returntype", void 0)
], AuthResolver.prototype, "me", null);
exports.AuthResolver = AuthResolver = __decorate([
    (0, graphql_1.Resolver)(() => graphql_models_1.AuthResponse),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthResolver);
//# sourceMappingURL=auth.resolver.js.map