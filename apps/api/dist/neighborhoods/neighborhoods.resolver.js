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
exports.NeighborhoodsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const neighborhoods_service_1 = require("./neighborhoods.service");
const graphql_models_1 = require("../graphql-models");
const create_neighborhood_input_1 = require("./dto/create-neighborhood.input");
const common_1 = require("@nestjs/common");
const gql_auth_guard_1 = require("../auth/gql-auth.guard");
let NeighborhoodsResolver = class NeighborhoodsResolver {
    neighborhoodsService;
    constructor(neighborhoodsService) {
        this.neighborhoodsService = neighborhoodsService;
    }
    createNeighborhood(createNeighborhoodInput) {
        return this.neighborhoodsService.create(createNeighborhoodInput);
    }
    findAll() {
        return this.neighborhoodsService.findAll();
    }
};
exports.NeighborhoodsResolver = NeighborhoodsResolver;
__decorate([
    (0, graphql_1.Mutation)(() => graphql_models_1.Neighborhood),
    (0, common_1.UseGuards)(gql_auth_guard_1.GqlAuthGuard),
    __param(0, (0, graphql_1.Args)('createNeighborhoodInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_neighborhood_input_1.CreateNeighborhoodInput]),
    __metadata("design:returntype", void 0)
], NeighborhoodsResolver.prototype, "createNeighborhood", null);
__decorate([
    (0, graphql_1.Query)(() => [graphql_models_1.Neighborhood], { name: 'neighborhoods' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], NeighborhoodsResolver.prototype, "findAll", null);
exports.NeighborhoodsResolver = NeighborhoodsResolver = __decorate([
    (0, graphql_1.Resolver)(() => graphql_models_1.Neighborhood),
    __metadata("design:paramtypes", [neighborhoods_service_1.NeighborhoodsService])
], NeighborhoodsResolver);
//# sourceMappingURL=neighborhoods.resolver.js.map